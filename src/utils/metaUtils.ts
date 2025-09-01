interface EventMeta {
  title: string
  description: string
  image?: string
  url: string
  siteName?: string
  type?: string
  locale?: string
  author?: string
  publishedTime?: string
  location?: string
}

export const updateMetaTags = (meta: EventMeta) => {
  const head = document.head

  // Helper function to update or create meta tag
  const updateMetaTag = (selector: string, content: string, property?: string) => {
    let element = head.querySelector(selector) as HTMLMetaElement
    if (!element) {
      element = document.createElement('meta')
      if (property) {
        element.setAttribute('property', property)
      } else if (selector.includes('[name=')) {
        const name = selector.match(/name="([^"]+)"/)?.[1]
        if (name) element.setAttribute('name', name)
      } else if (selector.includes('[property=')) {
        const prop = selector.match(/property="([^"]+)"/)?.[1]
        if (prop) element.setAttribute('property', prop)
      }
      head.appendChild(element)
    }
    element.setAttribute('content', content)
  }

  // Update document title
  document.title = meta.title

  // Basic meta tags
  updateMetaTag('meta[name="description"]', meta.description)
  updateMetaTag('meta[name="author"]', meta.author || 'GoEvent')

  // Open Graph tags
  updateMetaTag('meta[property="og:type"]', meta.type || 'website', 'og:type')
  updateMetaTag('meta[property="og:title"]', meta.title, 'og:title')
  updateMetaTag('meta[property="og:description"]', meta.description, 'og:description')
  updateMetaTag('meta[property="og:url"]', meta.url, 'og:url')
  updateMetaTag('meta[property="og:site_name"]', meta.siteName || 'GoEvent', 'og:site_name')
  updateMetaTag('meta[property="og:locale"]', meta.locale || 'en_US', 'og:locale')

  if (meta.image) {
    updateMetaTag('meta[property="og:image"]', meta.image, 'og:image')
    updateMetaTag('meta[property="og:image:alt"]', `${meta.title} - Event Image`, 'og:image:alt')
    updateMetaTag('meta[property="og:image:width"]', '1200', 'og:image:width')
    updateMetaTag('meta[property="og:image:height"]', '630', 'og:image:height')
  }

  if (meta.publishedTime) {
    updateMetaTag('meta[property="article:published_time"]', meta.publishedTime, 'article:published_time')
  }

  if (meta.location) {
    updateMetaTag('meta[property="event:location"]', meta.location, 'event:location')
  }

  // Twitter Card tags
  updateMetaTag('meta[name="twitter:card"]', meta.image ? 'summary_large_image' : 'summary')
  updateMetaTag('meta[name="twitter:title"]', meta.title)
  updateMetaTag('meta[name="twitter:description"]', meta.description)
  updateMetaTag('meta[name="twitter:site"]', '@GoEvent')
  updateMetaTag('meta[name="twitter:creator"]', '@GoEvent')

  if (meta.image) {
    updateMetaTag('meta[name="twitter:image"]', meta.image)
    updateMetaTag('meta[name="twitter:image:alt"]', `${meta.title} - Event Image`)
  }

  // Additional event-specific structured data
  const eventStructuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": meta.title,
    "description": meta.description,
    "url": meta.url,
    "image": meta.image,
    "location": meta.location ? {
      "@type": "Place",
      "name": meta.location
    } : undefined,
    "organizer": {
      "@type": "Organization",
      "name": meta.author || "GoEvent"
    },
    "startDate": meta.publishedTime,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "USD"
    }
  }

  // Update structured data
  let structuredDataElement = head.querySelector('script[type="application/ld+json"]')
  if (!structuredDataElement) {
    structuredDataElement = document.createElement('script')
    structuredDataElement.setAttribute('type', 'application/ld+json')
    head.appendChild(structuredDataElement)
  }
  structuredDataElement.textContent = JSON.stringify(eventStructuredData, null, 2)
}

export const resetMetaTags = () => {
  // Reset to default meta tags when leaving showcase pages
  document.title = 'GoEvent'
  
  const defaultMeta = {
    title: 'GoEvent - Create Amazing Events',
    description: 'Create, manage, and showcase beautiful events with GoEvent. Perfect for weddings, conferences, parties, and more.',
    url: window.location.origin,
    siteName: 'GoEvent',
    type: 'website'
  }
  
  updateMetaTags(defaultMeta)
  
  // Remove event-specific structured data
  const structuredDataElement = document.head.querySelector('script[type="application/ld+json"]')
  if (structuredDataElement) {
    structuredDataElement.remove()
  }
}

// Helper function to extract the best image from event data
export const getBestEventImage = (event: Record<string, unknown>): string | undefined => {
  // Priority: banner_image > logo_one > logo_two > first featured photo > first photo
  if (event.banner_image) return event.banner_image as string
  if (event.logo_one) return event.logo_one as string  
  if (event.logo_two) return event.logo_two as string
  
  const photos = event.photos as Array<{ image: string; is_featured: boolean }> | undefined
  if (photos && photos.length > 0) {
    // Look for featured photo first
    const featuredPhoto = photos.find((photo) => photo.is_featured)
    if (featuredPhoto) return featuredPhoto.image
    
    // Otherwise use first photo
    return photos[0].image
  }
  
  return undefined
}

// Helper function to create a good description
export const createEventDescription = (event: Record<string, unknown>): string => {
  const description = event.description as string | undefined
  if (description && description.trim()) {
    // Truncate long descriptions for meta tags (160 chars max for SEO)
    return description.length > 160 
      ? description.substring(0, 157) + '...'
      : description
  }
  
  const shortDescription = event.short_description as string | undefined
  if (shortDescription && shortDescription.trim()) {
    return shortDescription
  }
  
  // Fallback description
  const categoryDetails = event.category_details as { name?: string } | undefined
  const eventType = categoryDetails?.name || 'Event'
  const location = event.location ? ` in ${event.location}` : ''
  const organizerDetails = event.organizer_details as { first_name?: string; username?: string } | undefined
  const organizer = organizerDetails?.first_name || organizerDetails?.username || 'GoEvent'
  
  return `Join ${organizer} for ${event.title as string}, a ${eventType.toLowerCase()}${location}. RSVP now on GoEvent!`
}