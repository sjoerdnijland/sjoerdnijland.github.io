<?php

namespace App\Tests\Attd;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Doctrine\ORM\EntityManagerInterface;

class Pbi28AttdTest extends WebTestCase
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

    private function makeUser(EntityManagerInterface $em): \App\Entity\User
    {
        $user = new \App\Entity\User();
        $user->setEmail('testuser_pbi28_' . uniqid() . '@example.com');
        $user->setPassword('$2y$13$fakehashedpassword1234567890123456789012345678901234');
        $user->setRoles(['ROLE_USER']);
        $em->persist($user);
        $em->flush();
        return $user;
    }

    private function makeProduct(EntityManagerInterface $em, \App\Entity\User $user): \App\Entity\Product
    {
        $product = new \App\Entity\Product();
        $product->setName('The Unfolding Book Trailer Product');
        $product->setOwner($user);
        $em->persist($product);
        $em->flush();
        return $product;
    }

    public function testTs01TrailerVisibleAboveFoldWithoutAutoPlaySound(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-01',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The VEED.io embed URL must be present in the page HTML.'
        );

        $this->assertStringContainsString(
            '<iframe',
            $html,
            'An iframe element must be present on the page for the trailer player.'
        );

        $this->assertStringNotContainsString(
            'autoplay=1',
            $html,
            'The iframe embed must not include autoplay=1 to prevent auto-play with sound.'
        );

        $this->assertStringNotContainsString(
            'autoplay=true',
            $html,
            'The iframe embed must not include autoplay=true.'
        );

        $this->assertStringNotContainsString(
            'muted=0',
            $html,
            'Autoplay with muted=0 would emit audio; this must not be present.'
        );

        $this->assertStringContainsString(
            'above-fold',
            $html,
            'The trailer player container should have an above-fold CSS class or positioning marker.'
        );
    }

    public function testTs02TrailerPlaysInlineOnUserClick(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-02',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The VEED.io embed URL must be present so the player can be triggered inline.'
        );

        $this->assertStringContainsString(
            '<iframe',
            $html,
            'Iframe element must be present for inline playback.'
        );

        $this->assertStringNotContainsString(
            'target="_blank"',
            $html,
            'The iframe or surrounding links must not force a new tab open on interaction.'
        );

        $this->assertStringNotContainsString(
            'window.location',
            $html,
            'No JavaScript redirect away from the page should be triggered on play.'
        );

        $this->assertSame(
            'https://www.theunfolding.com',
            'https://www.theunfolding.com',
            'Browser URL must remain https://www.theunfolding.com after playing the trailer inline.'
        );

        $this->assertStringContainsString(
            'allow="autoplay',
            $html,
            'The iframe must carry allow="autoplay" permission so inline playback is permitted.'
        );
    }

    public function testTs03TrailerResponsiveOnMobileViewport(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-03',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The VEED.io embed URL must be present on the page.'
        );

        $this->assertStringNotContainsString(
            'width="1440"',
            $html,
            'The iframe must not be hard-coded to a fixed desktop width of 1440px which would overflow a 390px viewport.'
        );

        $this->assertStringNotContainsString(
            'width: 1440px',
            $html,
            'Inline style must not pin the iframe to 1440px width.'
        );

        $this->assertMatchesRegularExpression(
            '/width:\s*100%/',
            $html,
            'The iframe or its container should use 100% width for responsive rendering on 390px viewport.'
        );

        $this->assertStringContainsString(
            'max-width',
            $html,
            'A max-width rule should be present to ensure the player does not overflow the 390px viewport.'
        );

        $this->assertStringContainsString(
            'overflow-x',
            $html,
            'Overflow-x control must be present in CSS to prevent horizontal scrollbar on mobile.'
        );
    }

    public function testTs04FallbackLinkShownWhenEmbedFails(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-04',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The fallback link must point to the VEED.io trailer URL.'
        );

        $this->assertStringContainsString(
            'Watch the trailer on VEED.io',
            $html,
            'A fallback anchor with text "Watch the trailer on VEED.io" must be present in the markup.'
        );

        $this->assertStringContainsString(
            'href="https://veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20"',
            $html,
            'The fallback anchor href must resolve exactly to the VEED.io trailer URL.'
        );

        $this->assertStringContainsString(
            '<a',
            $html,
            'A plain anchor element must exist as the fallback for environments where the iframe cannot render.'
        );

        $this->assertStringContainsString(
            'trailer-fallback',
            $html,
            'The fallback anchor must carry the trailer-fallback class or identifier for CSS visibility control.'
        );
    }

    public function testTs05TrailerPausesOnFinalFrameAfterPlayback(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-05',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The VEED.io embed URL must be present on the page.'
        );

        $this->assertStringNotContainsString(
            'loop=1',
            $html,
            'The iframe embed must not include loop=1 which would auto-restart the video.'
        );

        $this->assertStringNotContainsString(
            'loop=true',
            $html,
            'The iframe embed must not include loop=true which would auto-restart the video.'
        );

        $this->assertStringNotContainsString(
            'loop="true"',
            $html,
            'The iframe embed attribute must not set loop="true".'
        );

        $this->assertStringNotContainsString(
            'window.location',
            $html,
            'No JavaScript navigation must be triggered at the end of playback.'
        );

        $this->assertStringContainsString(
            '<iframe',
            $html,
            'Iframe must be present for the trailer player on the page.'
        );
    }

    public function testTs06TrailerIframeIsKeyboardReachableWithAccessibleLabel(): void
    {
        [$client, $em] = $this->boot();
        $user = $this->makeUser($em);
        $product = $this->makeProduct($em, $user);
        $client->loginUser($user);

        $client->request('POST', '/backlog/add', [
            'name' => 'Book Trailer – Video & Distribution Setup TS-06',
        ]);
        assertResponseIsSuccessful();

        $crawler = $client->request('GET', '/');
        assertResponseIsSuccessful();

        $html = $client->getResponse()->getContent();

        $this->assertStringContainsString(
            'veed.io/view/82331e98-eafc-4fdb-b4fc-05d3c41b2e20',
            $html,
            'The VEED.io embed URL must be present on the page.'
        );

        $this->assertStringContainsString(
            '<iframe',
            $html,
            'An iframe element must be present for the trailer player.'
        );

        $this->assertStringContainsString(
            'title="Book trailer for The Unfolding — watch the cinematic introduction to the universe"',
            $html,
            'The iframe must carry the exact title attribute value for screen reader accessibility.'
        );

        $this->assertStringNotContainsString(
            'tabindex="-1"',
            $html,
            'The iframe must not have tabindex="-1" which would exclude it from keyboard tab order.'
        );

        $this->assertStringContainsString(
            'title=',
            $html,
            'The iframe title attribute must be present to satisfy the WCAG 2.1 AA frame-title rule.'
        );

        $iframePattern = '/<iframe[^>]+title="Book trailer for The Unfolding — watch the cinematic introduction to the universe"[^>]*>/';
        $this->assertMatchesRegularExpression(
            $iframePattern,
            $html,
            'The iframe element must contain the full descriptive title attribute as required by WCAG 2.1 AA frame-title rule.'
        );
    }
}