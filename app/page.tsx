import { HeroSection } from "@/components/home/hero-section"
import { AdVideoSection } from "@/components/home/ad-video-section"
import { HomepageVideosSection } from "@/components/home/homepage-videos-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { DealsSection } from "@/components/home/deals-section"
import { VideosSection } from "@/components/home/videos-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { NewsletterSection } from "@/components/home/newsletter-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AdVideoSection />
      <HomepageVideosSection />
      <CategoriesSection />
      <FeaturedProducts />
      <DealsSection />
      <VideosSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  )
}
