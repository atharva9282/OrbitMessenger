export default function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark"><i/><i/><i/></span>{!compact && <span className="brand-name">orbit<span>.</span></span>}</div>
}
