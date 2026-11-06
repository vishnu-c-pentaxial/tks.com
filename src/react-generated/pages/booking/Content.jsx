import Section01 from "./sections/Section01.jsx";
import Section02 from "./sections/Section02.jsx";
import Section03 from "./sections/Section03.jsx";

export default function Content() {
  return (
    <div id={"content"} className={"site-content"}>
      <div className={"content-inner"}>
        <div className={"container content-container"}>
          <div className={"row content-row"}>
            <div id={"primary"} className={"content-area content-full-width col-12"}>
              <main id={"main"} className={"site-main"}>
                <article id={"post-12694"} className={"post-12694 page type-page status-publish hentry"}>
                  <div className={"entry-content clearfix"}>
                    <div
                      data-elementor-type={"wp-page"}
                      data-elementor-id={"12694"}
                      className={"elementor elementor-12694"}
                    >
                      <div
                        className={"elementor-element elementor-element-a8b1b87 e-flex e-con-boxed e-con e-parent"}
                        data-id={"a8b1b87"}
                        data-element_type={"container"}
                        data-e-type={"container"}
                      >
                        <div className={"e-con-inner"}>
                          <Section01 />
                          <Section02 />
                          <Section03 />
                        </div>
                      </div>
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
