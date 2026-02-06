export interface VideoGuide {
  id: string
  question: string
  videoEmbedUrl: string
  category?: string
  duration?: string
  order: number
}

export const VIDEO_GUIDES: VideoGuide[] = [
  {
    id: 'create-wedding-event',
    question: 'How to create a wedding event?',
    videoEmbedUrl: 'https://www.youtube.com/embed/s1fxZ-VWs2U?si=P3dfbb70lBZjDHvp',
    category: 'events',
    duration: '5:30',
    order: 1,
  },
]
