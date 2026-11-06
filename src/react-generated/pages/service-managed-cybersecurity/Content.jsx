import Section01 from "./sections/Section01.jsx";
import Section02 from "./sections/Section02.jsx";
import Section03 from "./sections/Section03.jsx";
import Section04 from "./sections/Section04.jsx";
import Section05 from "./sections/Section05.jsx";
import Section06 from "./sections/Section06.jsx";

export default function Content() {
  return (
    <div id={"content"} className={"site-content"}>
      <div className={"content-inner"}>
        <div data-elementor-type={"wp-post"} data-elementor-id={"10704"} className={"elementor elementor-10704"}>
          <Section01 />
          <Section02 />
          <Section03 />
          <Section04 />
          <Section05 />
          <Section06 />
        </div>
      </div>
    </div>
  );
}
