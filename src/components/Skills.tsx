import { SITE } from "@/data";
import Ico from "./Ico";

export default function Skills() {
  return (
    <>
      <p className="skills-intro intro" id="skills-intro">{SITE.skillsIntro}</p>
      <div className="skills skills-row" id="skills">
        {Object.entries(SITE.skills).map(([group, items]) => (
          <div key={group}>
            <h3>{group}</h3>
            <ul className="tiles">
              {items.map(([label, icon]) => <li key={label} className="tile"><Ico name={icon} /><span>{label}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
