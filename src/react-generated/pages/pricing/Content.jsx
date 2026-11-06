import Section01 from "./sections/Section01.jsx";
import Section02 from "./sections/Section02.jsx";
import Section03 from "./sections/Section03.jsx";
import Section04 from "./sections/Section04.jsx";
import Section05 from "./sections/Section05.jsx";
import Section06 from "./sections/Section06.jsx";
import Section07 from "./sections/Section07.jsx";
import Section08 from "./sections/Section08.jsx";

export default function Content() {
  return (
    <div id={"content"} className={"site-content"}>
      <div className={"content-inner"}>
        <div className={"container content-container"}>
          <div className={"row content-row"}>
            <div id={"primary"} className={"content-area content-full-width col-12"}>
              <main id={"main"} className={"site-main"}>
                <article id={"post-12565"} className={"post-12565 page type-page status-publish hentry"}>
                  <div className={"entry-content clearfix"}>
                    <div
                      data-elementor-type={"wp-page"}
                      data-elementor-id={"12565"}
                      className={"elementor elementor-12565"}
                    >
                      <Section01 />
                      <Section02 />
                      <Section03 />
                      <Section04 />
                      <Section05 />
                      <Section06 />
                      <Section07 />
                      <Section08 />
                    </div>
                  </div>
                </article>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
