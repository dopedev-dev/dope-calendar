import { onMounted, onUnmounted, type Ref } from 'vue'

export function useDragToScroll(
  elementRef: Ref<HTMLElement | null>,
  isZooming?: Ref<boolean>
) {
  let isDown = false
  let startX: number
  let scrollLeft: number
  let startY: number
  let scrollTop: number

    const handleMouseDown = (e: MouseEvent) => {
    if (!elementRef.value) return
    // Check if scrolling is disabled
    if (elementRef.value.classList.contains('scroll-disabled')) return
    
    isDown = true
    elementRef.value.classList.remove('cursor-grab')
    elementRef.value.classList.add('cursor-grabbing')
    startX = e.pageX - elementRef.value.offsetLeft
    scrollLeft = elementRef.value.scrollLeft
    startY = e.pageY - elementRef.value.offsetTop
    scrollTop = elementRef.value.scrollTop
    e.preventDefault()
  }


  const handleMouseLeave = () => {
    if (!elementRef.value) return
    isDown = false
    elementRef.value.classList.add('cursor-grab')
    elementRef.value.classList.remove('cursor-grabbing')
  }

  const handleMouseUp = () => {
    if (!elementRef.value) return
    isDown = false
    elementRef.value.classList.add('cursor-grab')
    elementRef.value.classList.remove('cursor-grabbing')
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDown || !elementRef.value) return
    e.preventDefault()
    const x = e.pageX - elementRef.value.offsetLeft
    const walkX = (x - startX) * 2 // The multiplier makes scrolling feel faster
    elementRef.value.scrollLeft = scrollLeft - walkX

    if (isZooming && isZooming.value) return

    const y = e.pageY - elementRef.value.offsetTop
    const walkY = (y - startY) * 2 // The multiplier makes scrolling feel faster
    elementRef.value.scrollTop = scrollTop - walkY
  }

  onMounted(() => {
    const el = elementRef.value
    if (el) {
      el.addEventListener('mousedown', handleMouseDown)
      el.addEventListener('mouseleave', handleMouseLeave)
      el.addEventListener('mouseup', handleMouseUp)
      el.addEventListener('mousemove', handleMouseMove)
    }
  })

  onUnmounted(() => {
    const el = elementRef.value
    if (el) {
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('mouseup', handleMouseUp)
      el.removeEventListener('mousemove', handleMouseMove)
    }
  })
}