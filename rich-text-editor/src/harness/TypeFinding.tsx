import { type InputExpression, resolveExpression } from "../editor";

/**
 * Why the editor commits to one expression type, shown rather than asserted.
 *
 * This used to be a switch on pane 5. It was moved here and made read-only
 * once the decision was made: offering the type as a control implied the
 * author picks, and they do not. The comparison still earns its place, because
 * it is the reason for the decision.
 *
 * Both columns are computed by the same glimmer port the preview uses, so they
 * cannot drift from what the pipeline actually does.
 */

const SAMPLE = "<h1>Hi {{$sf.results.company.name}}</h1>";

const resolve = (type: InputExpression["type"]) =>
  resolveExpression({ type, value: SAMPLE }, { escape: false }).output;

export const TypeFinding = () => (
  <div className="finding">
    <div className="finding__hd">What happens if the expression type is wrong</div>

    <div className="finding__body">
      <p className="finding__lede">
        The same stored string, under the two types. Nothing else about the two
        records differs.
      </p>

      <div className="finding__grid">
        <div className="finding__col">
          <span className="finding__tag ok">type: "template"</span>
          <code className="finding__out">{resolve("template")}</code>
          <p className="finding__note">
            The token was replaced with the step's real output.
          </p>
        </div>
        <div className="finding__col">
          <span className="finding__tag bad">
            type: "value" &nbsp;·&nbsp; the default today
          </span>
          <code className="finding__out">{resolve("value")}</code>
          <p className="finding__note">
            Delivered to the recipient as literal characters.
          </p>
        </div>
      </div>

      <p className="finding__why">
        A code input is created as <code>value</code>, and nothing infers
        otherwise from its content. An editor whose whole affordance is
        inserting references cannot write the one type that makes them inert, so{" "}
        <b>this editor always writes <code>template</code></b> and does not offer
        the choice.
      </p>

      <p className="finding__note">
        Two limits on generalising that. <b>It must not be extended to{" "}
        <code>code</code> as a whole</b> — <code>handlebars</code> and{" "}
        <code>liquid</code> block syntax starts with <code>{"{{#"}</code>, the
        same prefix glimmer uses for config variables, so{" "}
        <code>{"{{#if user}}"}</code> as a template throws and the runner
        swallows that to <code>undefined</code>. And <b>
          <code>template</code> contributes step dependencies where{" "}
          <code>value</code> contributes none
        </b>, so converting an existing input can reorder a flow.
      </p>
    </div>
  </div>
);
