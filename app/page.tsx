"use client";

import { useMemo, useState } from "react";

type Booking = {
  customer: string;
  service: string;
  stylist: string;
  date: string;
  time: string;
};

type Workflow = Booking & {
  duration: number;
  preparation: string[];
  missing: string[];
  approval: boolean;
  next: string;
  suggestion: string;
  source?: string;
};

const sample: Booking = {
  customer: "Hana Yamada",
  service: "Cut + Color",
  stylist: "Yuko Sato",
  date: "2026-07-20",
  time: "15:00"
};

export default function Home() {
  const [booking, setBooking] = useState(sample);
  const [view, setView] =
    useState<"booking" | "processing" | "dashboard">("booking");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");

  const prettyDate = useMemo(
    () =>
      new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }),
    [booking.date]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setView("processing");

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setWorkflow(data);
      setApproved(!data.approval);
      setTimeout(() => setView("dashboard"), 900);
    } catch {
      setError("The workflow could not be processed. Please try again.");
      setView("booking");
    }
  }

  function restart() {
    setBooking(sample);
    setWorkflow(null);
    setApproved(false);
    setView("booking");
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={restart}>
          <span>L’</span>avian Core
        </button>

        <div className="category">
          OpenAI Build Week · Work &amp; Productivity
        </div>

        <button className="ghost" onClick={restart}>
          Restart demo
        </button>
      </header>

      {view === "booking" && (
        <section className="bookingPage">
          <div className="intro">
            <p className="eyebrow">BEAUTY SALON WORKFLOW DEMO</p>

            <h1>
              One request in.
              <br />
              <em>A coordinated workflow out.</em>
            </h1>

            <p>
              AI handles the coordination work. Your team steps in only when
              judgment is actually required.
            </p>

            <div className="metric">
              <b>9</b>
              <span>manual steps reduced to</span>
              <b>1</b>
              <span>human decision</span>
            </div>
          </div>

          <form className="bookingCard" onSubmit={submit}>
            <div className="cardHead">
              <div>
                <p className="eyebrow">CUSTOMER BOOKING</p>
                <h2>Book your appointment</h2>
              </div>

              <span className="step">01</span>
            </div>

            <label>
              Your name
              <input
                value={booking.customer}
                onChange={(event) =>
                  setBooking({
                    ...booking,
                    customer: event.target.value
                  })
                }
                required
              />
            </label>

            <div className="two">
              <label>
                Service
                <select
                  value={booking.service}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      service: event.target.value
                    })
                  }
                >
                  <option>Cut + Color</option>
                  <option>Haircut</option>
                  <option>Color</option>
                  <option>Treatment</option>
                </select>
              </label>

              <label>
                Stylist
                <select
                  value={booking.stylist}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      stylist: event.target.value
                    })
                  }
                >
                  <option>Yuko Sato</option>
                  <option>Mia Chen</option>
                  <option>Alex Morgan</option>
                </select>
              </label>
            </div>

            <div className="two">
              <label>
                Date
                <input
                  type="date"
                  value={booking.date}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      date: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Available time
                <select
                  value={booking.time}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      time: event.target.value
                    })
                  }
                >
                  <option value="10:00">10:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </label>
            </div>

            {error && <p className="error">{error}</p>}

            <button className="primary">
              Submit booking <span>→</span>
            </button>

            <p className="fine">
              Sample data is prefilled for a 30-second test.
            </p>
          </form>
        </section>
      )}

      {view === "processing" && (
        <section className="processing">
          <div className="orb">
            <i />
          </div>

          <p className="eyebrow">L’AVIAN CORE IS COORDINATING</p>

          <h1>
            Turning one request into
            <br />
            an executable workflow
          </h1>

          <div className="processGrid">
            {[
              "Interpreting request",
              "Structuring booking",
              "Updating operations",
              "Finding decisions"
            ].map((item, index) => (
              <div key={item}>
                <span className="check">✓</span>
                <b>{item}</b>
                <small>
                  {index === 0
                    ? "Customer intent understood"
                    : index === 1
                      ? "Fields normalized"
                      : index === 2
                        ? "Tasks and schedule prepared"
                        : "Human judgment isolated"}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "dashboard" && workflow && (
        <section className="dashboard">
          <div className="dashTitle">
            <div>
              <p className="eyebrow">OPERATIONS DASHBOARD</p>

              <h1>
                {approved ? "Ready for service" : "One decision required"}
              </h1>

              <p>
                {approved
                  ? "The workflow is complete. Your team has everything it needs."
                  : "AI completed the coordination work and isolated the only judgment call."}
              </p>
            </div>

            <span className={approved ? "status ready" : "status"}>
              {approved
                ? "✓ READY FOR SERVICE"
                : "1 APPROVAL REQUIRED"}
            </span>
          </div>

          <div className="layout">
            <div className="left">
              <article className="panel">
                <div className="panelTitle">
                  <h2>Booking</h2>
                  <span>Processed</span>
                </div>

                <div className="bookingSummary">
                  <div className="avatar">HY</div>

                  <div>
                    <b>{workflow.customer}</b>
                    <small>
                      {workflow.service} with {workflow.stylist}
                    </small>
                  </div>

                  <div className="when">
                    <b>{prettyDate}</b>
                    <small>
                      {booking.time === "15:00"
                        ? "3:00 PM"
                        : booking.time}{" "}
                      · {workflow.duration} min
                    </small>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panelTitle">
                  <h2>AI processing</h2>

                  <span className="ai">
                    {workflow.source === "openai"
                      ? "GPT-5.6 LIVE"
                      : "DEMO MODE"}
                  </span>
                </div>

                {workflow.source !== "openai" && (
                  <p className="demoNote">
                    Deterministic sample processing is active. Configure the
                    server-side OpenAI key to verify live model processing.
                  </p>
                )}

                <div className="actions">
                  <div>
                    <i>01</i>
                    <b>Request structured</b>
                    <small>
                      Customer, service, stylist and time extracted
                    </small>
                  </div>

                  <div>
                    <i>02</i>
                    <b>Customer record prepared</b>
                    <small>Booking context attached to the workflow</small>
                  </div>

                  <div>
                    <i>03</i>
                    <b>Schedule update prepared</b>
                    <small>
                      {workflow.duration}-minute service block reserved
                    </small>
                  </div>

                  <div>
                    <i>04</i>
                    <b>Preparation task created</b>
                    <small>
                      Color station and assistant handoff prepared
                    </small>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panelTitle">
                  <h2>Preparation</h2>
                  <span>{approved ? "Complete" : "In progress"}</span>
                </div>

                <div className="prep">
                  <div>
                    <small>COLOR FORMULA</small>
                    <b>
                      {workflow.approval
                        ? approved
                          ? workflow.suggestion
                          : "Not selected"
                        : "Not required"}
                    </b>
                  </div>

                  <div>
                    <small>TREATMENT</small>
                    <b>
                      {workflow.approval
                        ? "Color protect"
                        : "Standard finish"}
                    </b>
                  </div>

                  <div>
                    <small>ASSISTANT</small>
                    <b>Emi Tanaka</b>
                  </div>

                  <div>
                    <small>STATUS</small>
                    <b>{approved ? "Ready" : "Waiting for approval"}</b>
                  </div>
                </div>
              </article>
            </div>

            <aside>
              <article
                className={approved ? "approval approved" : "approval"}
              >
                <div className="approvalIcon">{approved ? "✓" : "!"}</div>

                <p className="eyebrow">
                  {approved ? "WORKFLOW COMPLETE" : "HUMAN JUDGMENT"}
                </p>

                <h2>
                  {approved ? "Ready for service" : "Approval required"}
                </h2>

                <p>
                  {approved
                    ? workflow.approval
                      ? "The color formula is confirmed and every preparation task is ready."
                      : "No professional decision is missing. Every preparation task is ready."
                    : "The booking is valid. One professional decision remains before preparation can finish."}
                </p>

                <div className="decision">
                  <small>COLOR FORMULA</small>

                  <b>
                    {workflow.approval
                      ? approved
                        ? workflow.suggestion
                        : "Not selected"
                      : "Not required"}
                  </b>

                  {!approved && (
                    <>
                      <small>AI SUGGESTION</small>
                      <strong>{workflow.suggestion}</strong>
                      <span>
                        Based on the selected service and salon defaults
                      </span>
                    </>
                  )}
                </div>

                {!approved ? (
                  <div className="buttons">
                    <button
                      className="approve"
                      onClick={() => setApproved(true)}
                    >
                      Approve suggestion
                    </button>

                    <button className="change">Change</button>
                  </div>
                ) : (
                  <button className="outline" onClick={restart}>
                    Run demo again
                  </button>
                )}
              </article>

              <article className="channel">
                <span>Channel-agnostic</span>
                <p>
                  LINE is represented as the notification layer in this demo.
                  The same Core can connect to email, WhatsApp, Slack, web
                  forms, or other channels.
                </p>
              </article>
            </aside>
          </div>

          <div className="impact">
            <div>
              <small>BEFORE</small>
              <b>9 manual steps</b>
            </div>

            <span>→</span>

            <div>
              <small>WITH L’AVIAN CORE</small>
              <b>1 human decision</b>
            </div>

            <p>Fewer decisions, not more tools.</p>
          </div>
        </section>
      )}

      <footer>
        <span>L’avian Core</span>
        <p>
          AI is not just answering questions. It is coordinating operations.
        </p>
        <span>Beauty salon · Demo environment</span>
      </footer>
    </main>
  );
}
