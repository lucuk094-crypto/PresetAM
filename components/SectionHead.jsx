import Reveal from './Reveal';

export default function SectionHead({ index, title, sub, invert = false }) {
  return (
    <Reveal className={`sec-head ${invert ? 'invert' : ''}`}>
      <span className="sec-idx mono">{index}</span>
      <h2 className="sec-title">{title}</h2>
      {sub ? <p className="sec-sub">{sub}</p> : null}
    </Reveal>
  );
}
