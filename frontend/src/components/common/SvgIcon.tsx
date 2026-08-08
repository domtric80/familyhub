interface SvgIconProps {
  iconId: string
  className?: string
  style?: React.CSSProperties
}

export default function SvgIcon({ iconId, className, style }: SvgIconProps) {
  return (
    <svg className={className} style={style}>
      <use href={`/sprite.svg#${iconId}`} />
    </svg>
  )
}
