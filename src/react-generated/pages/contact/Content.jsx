import Section01 from "./sections/Section01.jsx";
import Section02 from "./sections/Section02.jsx";
import Section03 from "./sections/Section03.jsx";
import Section04 from "./sections/Section04.jsx";

export default function Content() {
  return (
    <div id={"content"} className={"site-content"}>
      <div className={"content-inner"}>
        <div data-elementor-type={"wp-page"} data-elementor-id={"12651"} className={"elementor elementor-12651"}>
          <Section01 />
          <Section02 />
          <Section03 />
          <Section04 />
        </div>
      </div>
    </div>
  );
}
