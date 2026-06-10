import { render, screen, act } from '@testing-library/react'
import Avatar from '../Avatar'

describe('Avatar', () => {
  it('renders initials fallback when src is null', () => {
    render(<Avatar src={null} name="Alice" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders initials fallback when src is undefined', () => {
    render(<Avatar name="Bob" />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders question mark when no name is given', () => {
    render(<Avatar src={null} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders img when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="Alice" />)
    const img = screen.getByAltText('Alice')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg')
  })

  it('switches to fallback on image error', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="Alice" />)
    const img = screen.getByAltText('Alice')
    act(() => {
      img.dispatchEvent(new Event('error'))
    })
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Avatar src={null} name="Alice" className="w-10 h-10" />,
    )
    const div = container.querySelector('.w-10.h-10')
    expect(div).toBeInTheDocument()
  })

  it('renders without inline styles', () => {
    const { container } = render(<Avatar src={null} name="Alice" />)
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })
})
