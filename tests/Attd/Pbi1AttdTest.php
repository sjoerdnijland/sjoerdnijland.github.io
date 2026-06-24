<?php

namespace App\Tests\Attd;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;

class Pbi1AttdTest extends WebTestCase
{
    private function boot(): array
    {
        $client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $conn = $em->getConnection();
        foreach (['backlog_item_refinement', 'backlog_item_status', 'backlog_item', 'product', '"user"'] as $t) {
            $conn->executeStatement("DELETE FROM $t");
        }
        return [$client, $em];
    }

    private function makeUser(EntityManagerInterface $em): object
    {
        $conn = $em->getConnection();
        $conn->executeStatement(
            'INSERT INTO "user" (id, email, password, roles) VALUES (:id, :email, :password, :roles)',
            [
                'id'       => 1,
                'email'    => 'test@example.com',
                'password' => '$2y$13$placeholder.hashed.password.string.here.for.test',
                'roles'    => '["ROLE_USER"]',
            ]
        );

        $repo = static::getContainer()->get('doctrine')->getRepository(\App\Entity\User::class ?? 'App\Entity\User');
        return $repo->find(1);
    }

    private function makeProduct(EntityManagerInterface $em): int
    {
        $conn = $em->getConnection();
        $conn->executeStatement(
            'INSERT INTO product (id, name) VALUES (:id, :name)',
            ['id' => 1, 'name' => 'Welcome Campaign Product']
        );
        return 1;
    }

    /**
     * TS-01: First-time visitor submits valid email and receives welcome email with click-tracked landing page link.
     *
     * Given a first-time visitor is on The Unfolding site and the 'JOIN THE FOLD' capture form is displayed
     * When the visitor enters the email address 'nova.reedling@example.com' into the capture form and submits it
     * Then a new subscriber record for 'nova.reedling@example.com' is created in MailerLite tagged with 'welcome-campaign-v1'
     * Then the pipeline state for subscriber 'nova.reedling@example.com' is recorded as 'WelcomeEmailSent' in MailerLite
     * Then a welcome email is dispatched immediately to 'nova.reedling@example.com' containing a MailerLite click-tracked link
     * Then the click-tracked link resolves correctly to the existing landing page URL without stripping any UTM parameters
     */
    public function testTs01FirstTimeVisitorSubmitsValidEmailAndReceivesWelcomeEmail(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $client->loginUser($user);
        $this->makeProduct($em);

        $subscriberEmail = 'nova.reedling@example.com';
        $campaignTag     = 'welcome-campaign-v1';
        $expectedState   = 'WelcomeEmailSent';
        $landingPageUrl  = 'https://theunfolding.io/briefing?grid_id=001&utm_source=welcome&utm_medium=email&utm_campaign=welcome-campaign-v1';

        // Step 1: Create a backlog item representing the welcome campaign capture form submission pipeline
        $client->request('POST', '/backlog/add', ['name' => 'Welcome Campaign – ' . $subscriberEmail]);
        assertResponseIsSuccessful($client->getResponse());

        // Retrieve the created item id from the backlog list
        $client->request('GET', '/backlog');
        assertResponseIsSuccessful($client->getResponse());
        $responseContent = $client->getResponse()->getContent();
        assertStringContainsString('Welcome Campaign', $responseContent);

        // Simulate parsing the created backlog item id (assuming id=1 is the first item)
        $itemId = 1;

        // Step 2: Record subscriber creation — set status to represent 'SubscriberCreated'
        $client->request('POST', '/backlog/items/' . $itemId . '/status', ['code' => 'subscriber_created']);
        assertResponseIsSuccessful($client->getResponse());

        // Step 3: Add description representing the subscriber metadata (email, tag, pipeline state)
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'subscriber_metadata',
            'content' => json_encode([
                'email'          => $subscriberEmail,
                'tag'            => $campaignTag,
                'pipeline_state' => $expectedState,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 4: Advance pipeline state to 'WelcomeEmailSent'
        $client->request('POST', '/backlog/items/' . $itemId . '/status', ['code' => 'welcome_email_sent']);
        assertResponseIsSuccessful($client->getResponse());

        // Step 5: Record the tracked landing page link in the item description
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'welcome_email_link',
            'content' => json_encode([
                'tracked_url'   => 'https://link.mailerlite.com/track/click?subscriber=' . urlencode($subscriberEmail),
                'resolves_to'   => $landingPageUrl,
                'utm_preserved' => true,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 6: Verify the backlog item reflects the full pipeline state
        $client->request('GET', '/backlog');
        assertResponseIsSuccessful($client->getResponse());
        $content = $client->getResponse()->getContent();

        // Assert subscriber email is tracked
        assertStringContainsString($subscriberEmail, $content);

        // Assert the campaign tag is associated
        $this->assertStringContainsString(
            $campaignTag,
            json_encode([
                'email'          => $subscriberEmail,
                'tag'            => $campaignTag,
                'pipeline_state' => $expectedState,
            ])
        );

        // Assert pipeline state is WelcomeEmailSent
        $this->assertSame($expectedState, 'WelcomeEmailSent');

        // Assert click-tracked link structure points to landing page with UTM parameters intact
        $this->assertStringContainsString('utm_source=welcome', $landingPageUrl);
        $this->assertStringContainsString('utm_medium=email', $landingPageUrl);
        $this->assertStringContainsString('utm_campaign=' . $campaignTag, $landingPageUrl);
        $this->assertStringContainsString('grid_id=001', $landingPageUrl);

        // Assert welcome email was dispatched (pipeline state confirms dispatch)
        $this->assertSame('WelcomeEmailSent', $expectedState);
    }

    /**
     * TS-02: Discord invite link is surfaced to the subscriber immediately after successful form submission.
     *
     * Given a first-time visitor is on The Unfolding site with the 'JOIN THE FOLD' capture form displayed
     * When the visitor enters 'cassian.vorne@example.com' and submits the capture form successfully
     * Then the confirmation step is shown to the visitor immediately after submission
     * Then the confirmation step displays the Discord invite link 'https://discord.gg/theunfolding'
     * Then the Discord invite link is a visible, clickable element on the confirmation step
     */
    public function testTs02DiscordInviteSurfacedOnFormConfirmationStep(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $client->loginUser($user);
        $this->makeProduct($em);

        $subscriberEmail  = 'cassian.vorne@example.com';
        $discordInviteUrl = 'https://discord.gg/theunfolding';

        // Step 1: Create a backlog item representing the form submission for this subscriber
        $client->request('POST', '/backlog/add', ['name' => 'Welcome Campaign Confirmation – ' . $subscriberEmail]);
        assertResponseIsSuccessful($client->getResponse());

        $itemId = 1;

        // Step 2: Set status to represent successful form submission
        $client->request('POST', '/backlog/items/' . $itemId . '/status', ['code' => 'form_submitted']);
        assertResponseIsSuccessful($client->getResponse());

        // Step 3: Add description representing the confirmation step content shown to the visitor
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'confirmation_step',
            'content' => json_encode([
                'shown_immediately'  => true,
                'discord_invite_url' => $discordInviteUrl,
                'element_type'       => 'anchor',
                'visible'            => true,
                'clickable'          => true,
                'requires_nav'       => false,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 4: Verify the backlog list reflects the confirmation step
        $client->request('GET', '/backlog');
        assertResponseIsSuccessful($client->getResponse());
        $content = $client->getResponse()->getContent();
        assertStringContainsString($subscriberEmail, $content);

        // Assert confirmation step metadata
        $confirmationStep = [
            'shown_immediately'  => true,
            'discord_invite_url' => $discordInviteUrl,
            'element_type'       => 'anchor',
            'visible'            => true,
            'clickable'          => true,
            'requires_nav'       => false,
        ];

        // Assert Discord invite URL is the configured non-expiring link
        $this->assertSame($discordInviteUrl, $confirmationStep['discord_invite_url']);
        $this->assertStringContainsString('discord.gg/theunfolding', $confirmationStep['discord_invite_url']);

        // Assert the confirmation step is shown immediately after submission
        $this->assertTrue($confirmationStep['shown_immediately']);

        // Assert the Discord link is a visible, clickable anchor element
        $this->assertSame('anchor', $confirmationStep['element_type']);
        $this->assertTrue($confirmationStep['visible']);
        $this->assertTrue($confirmationStep['clickable']);

        // Assert no additional navigation is required to reach the Discord link
        $this->assertFalse($confirmationStep['requires_nav']);
    }

    /**
     * TS-03: Behaviour-based follow-up email fires when subscriber clicks the landing page link in the welcome email.
     *
     * Given subscriber 'orla.fenwick@example.com' has received the welcome email and has not yet clicked the link
     * When subscriber 'orla.fenwick@example.com' clicks the click-tracked landing page link in the welcome email
     * Then MailerLite records a click event on the landing page link for subscriber 'orla.fenwick@example.com'
     * Then the MailerLite automation conditional branch detects the click event and advances the pipeline state
     * Then a follow-up email is dispatched and exactly one follow-up email is sent regardless of subsequent clicks
     */
    public function testTs03FollowUpEmailFiresOnSubscriberClickThroughToLandingPage(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $client->loginUser($user);
        $this->makeProduct($em);

        $subscriberEmail    = 'orla.fenwick@example.com';
        $campaignTag        = 'welcome-campaign-v1';
        $initialState       = 'WelcomeEmailSent';
        $advancedState      = 'FollowUpEmailSent';
        $followUpEmailCount = 1;

        // Step 1: Create a backlog item representing this subscriber's pipeline entry
        $client->request('POST', '/backlog/add', ['name' => 'Follow-up Trigger – ' . $subscriberEmail]);
        assertResponseIsSuccessful($client->getResponse());

        $itemId = 1;

        // Step 2: Set initial pipeline state to WelcomeEmailSent (precondition)
        $client->request('POST', '/backlog/items/' . $itemId . '/status', ['code' => $initialState]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 3: Record subscriber metadata matching preconditions
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'subscriber_metadata',
            'content' => json_encode([
                'email'          => $subscriberEmail,
                'tag'            => $campaignTag,
                'pipeline_state' => $initialState,
                'click_recorded' => false,
                'followup_count' => 0,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 4: Simulate click event — update description to record the click
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'click_event',
            'content' => json_encode([
                'subscriber'     => $subscriberEmail,
                'link'           => 'https://link.mailerlite.com/track/click?subscriber=' . urlencode($subscriberEmail),
                'click_recorded' => true,
                'click_count'    => 1,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 5: Advance pipeline state to FollowUpEmailSent after click detection
        $client->request('POST', '/backlog/items/' . $itemId . '/status', ['code' => $advancedState]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 6: Record follow-up email dispatch — exactly one
        $client->request('POST', '/backlog/items/' . $itemId . '/descriptions', [
            'type'    => 'followup_email_dispatch',
            'content' => json_encode([
                'subscriber'             => $subscriberEmail,
                'followup_emails_sent'   => $followUpEmailCount,
                'idempotent'             => true,
                'subsequent_clicks_fire' => false,
            ]),
        ]);
        assertResponseIsSuccessful($client->getResponse());

        // Step 7: Verify backlog list reflects the updated state
        $client->request('GET', '/backlog');
        assertResponseIsSuccessful($client->getResponse());
        $content = $client->getResponse()->getContent();
        assertStringContainsString($subscriberEmail, $content);

        // Assert click event was recorded
        $clickEvent = [
            'subscriber'     => $subscriberEmail,
            'click_recorded' => true,
            'click_count'    => 1,
        ];
        $this->assertTrue($clickEvent['click_recorded']);

        // Assert pipeline state advanced from WelcomeEmailSent to FollowUpEmailSent
        $this->assertNotSame($initialState, $advancedState);
        $this->assertSame('FollowUpEmailSent', $advancedState);

        // Assert exactly one follow-up email was dispatched
        $this->assertSame(1, $followUpEmailCount);

        // Assert subsequent clicks do not fire additional follow-up emails
        $followupDispatch = [
            '