"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Stage =
  | "site"
  | "stylist"
  | "schedule"
  | "menu"
  | "customer"
  | "approval"
  | "visit"
  | "service"
  | "checkout"
  | "complete";

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

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  threshold: number;
  qty: number;
};

const stylists = [
  { name: "Yuko Sato", role: "Color specialist", initials: "YS" },
  { name: "Mia Chen", role: "Cut & styling", initials: "MC" },
];

const services = [
  { name: "Cut + Color", duration: 150, price: 140, note: "Consultation, cut and full color" },
  { name: "Haircut", duration: 60, price: 65, note: "Consultation, shampoo and finish" },
  { name: "Color", duration: 120, price: 110, note: "Consultation and full color" },
  { name: "Treatment", duration: 60, price: 70, note: "Intensive repair treatment" },
];

const days = [
  { label: "MON", dateLabel: "Jul 20", value: "2026-07-20" },
  { label: "TUE", dateLabel: "Jul 21", value: "2026-07-21" },
  { label: "WED", dateLabel: "Jul 22", value: "2026-07-22" },
  { label: "THU", dateLabel: "Jul 23", value: "2026-07-23" },
  { label: "FRI", dateLabel: "Jul 24", value: "2026-07-24" },
];

const times = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const occupiedByStylist: Record<string, Set<string>> = {
  "Yuko Sato": new Set([
    "2026-07-20-09:00",
    "2026-07-20-11:00",
    "2026-07-21-10:00",
    "2026-07-21-14:00",
    "2026-07-22-09:00",
    "2026-07-22-13:00",
    "2026-07-23-11:00",
    "2026-07-23-15:00",
    "2026-07-24-10:00",
    "2026-07-24-16:00",
  ]),
  "Mia Chen": new Set([
    "2026-07-20-10:00",
    "2026-07-20-15:00",
    "2026-07-21-09:00",
    "2026-07-21-13:00",
    "2026-07-22-11:00",
    "2026-07-22-16:00",
    "2026-07-23-10:00",
    "2026-07-23-14:00",
    "2026-07-24-09:00",
    "2026-07-24-15:00",
  ]),
};

const initialProducts: Product[] = [
  { id: "P-101", name: "Color Protect Shampoo", sku: "CPS-250", price: 28, stock: 8, threshold: 5, qty: 0 },
  { id: "P-102", name: "Repair Treatment", sku: "RPT-200", price: 34, stock: 3, threshold: 3, qty: 0 },
  { id: "P-103", name: "Silk Hair Oil", sku: "SHO-050", price: 24, stock: 1, threshold: 2, qty: 0 },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function Home() {
  const [stage, setStage] = useState<Stage>("site");
  const [booking, setBooking] = useState<Booking>({
    customer: "Hana Yamada",
    service: "",
    stylist: "",
    date: "",
    time: "",
  });
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [arrival, setArrival] = useState("");
  const [serviceNotes, setServiceNotes] = useState(
    "Warm brown finish; protect previously lightened ends.",
  );
  const [option, setOption] = useState("Color protect treatment");
  const [optionFee, setOptionFee] = useState(20);
  const [discount, setDiscount] = useState(10);
  const [payment, setPayment] = useState("Card");
  const [products, setProducts] = useState(initialProducts);
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncLock = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [stage]);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  const selectedService = services.find((item) => item.name === booking.service);
  const serviceFee = selectedService?.price ?? 0;

  const productTotal = useMemo(
    () => products.reduce((sum, product) => sum + product.price * product.qty, 0),
    [products],
  );

  const subtotal = serviceFee + optionFee + productTotal - discount;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + tax;

  function go(next: Stage) {
    window.scrollTo(0, 0);
    setStage(next);
  }

  function restart() {
    setBooking({ customer: "Hana Yamada", service: "", stylist: "", date: "", time: "" });
    setWorkflow(null);
    setArrival("");
    setProducts(initialProducts);
    setSynced(false);
    setSyncing(false);
    syncLock.current = false;
    setError("");
    go("site");
  }

  async function submitBooking() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(booking),
      });

      if (!response.ok) throw new Error("Processing failed");

      const data = await response.json();
      setWorkflow(data);
      go("approval");
    } catch {
      setError("Processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeQuantity(id: string, difference: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, qty: Math.max(0, Math.min(product.stock, product.qty + difference)) }
          : product,
      ),
    );
  }

  async function finishWorkflow() {
    if (syncLock.current) return;

    syncLock.current = true;
    setSyncing(true);

    const completedAt = new Date().toISOString();
    const payload = {
      booking,
      workflow,
      visit: { arrival, serviceNotes, option },
      checkout: { serviceFee, optionFee, productTotal, discount, tax, total, payment },
      products: products
        .filter((product) => product.qty > 0)
        .map((product) => ({
          ...product,
          remaining: product.stock - product.qty,
          status:
            product.stock - product.qty === 0
              ? "out-of-stock"
              : product.stock - product.qty <= product.threshold
                ? "low-stock"
                : "in-stock",
        })),
      history: {
        service: booking.service,
        notes: serviceNotes,
        nextVisit: "6–8 weeks",
        completedAt,
      },
    };

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setSynced(Boolean(data.synced));
    } catch {
      setSynced(false);
    }

    setProducts((current) =>
      current.map((product) => ({ ...product, stock: product.stock - product.qty, qty: 0 })),
    );
    go("complete");
  }

  const customerStage = ["stylist", "schedule", "menu", "customer"].includes(stage);

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={restart}>
          <span>L’</span>avian Core
        </button>
        {!customerStage && (
          <div className="live">
            {workflow?.source === "openai" ? "● GPT-5.6 LIVE" : "● DEMO MODE"}
          </div>
        )}
        <button className="linkButton" onClick={restart}>Restart</button>
      </header>

      {stage === "site" ? null : customerStage ? (
        <CustomerProgress stage={stage} />
      ) : (
        <OperationsProgress stage={stage} />
      )}

      {stage === "site" && <SiteHome onStart={() => go("stylist")} />}

      {stage === "stylist" && (
        <CustomerShell
          step="01"
          eyebrow="BOOK AN APPOINTMENT"
          title="Choose your stylist"
          subtitle="Select the person you would like to book with."
        >
          <div className="choiceGrid">
            {stylists.map((stylist) => (
              <button
                key={stylist.name}
                className={`choiceCard ${booking.stylist === stylist.name ? "selected" : ""}`}
                onClick={() => {
                  setBooking({ ...booking, stylist: stylist.name, date: "", time: "" });
                  go("schedule");
                }}
              >
                <span className="avatar">{stylist.initials}</span>
                <span>
                  <b>{stylist.name}</b>
                  <small>{stylist.role}</small>
                </span>
                <i>→</i>
              </button>
            ))}
          </div>
        </CustomerShell>
      )}

      {stage === "schedule" && (
        <CustomerShell
          step="02"
          eyebrow="SELECT A TIME"
          title={`${booking.stylist}’s availability`}
          subtitle="White slots are available. Light pink slots are already booked."
          back={() => go("stylist")}
        >
          <div className="legend">
            <span><i className="availableDot" />Available</span>
            <span><i className="bookedDot" />Booked</span>
          </div>

          <div className="calendarWrap">
            <div className="weekCalendar">
              <div className="corner">TIME</div>
              {days.map((day) => (
                <div className="dayHead" key={day.value}>
                  <b>{day.label}</b>
                  <small>{day.dateLabel}</small>
                </div>
              ))}

              {times.map((time) => (
                <div className="calendarRow" key={time}>
                  <div className="timeLabel">{time}</div>
                  {days.map((day) => {
                    const key = `${day.value}-${time}`;
                    const occupied = occupiedByStylist[booking.stylist]?.has(key);
                    const selected = booking.date === day.value && booking.time === time;
                    return (
                      <button
                        key={key}
                        disabled={occupied}
                        className={`slot ${occupied ? "booked" : "available"} ${selected ? "selectedSlot" : ""}`}
                        onClick={() => {
                          setBooking({ ...booking, date: day.value, time });
                          go("menu");
                        }}
                        aria-label={`${day.dateLabel} ${time} ${occupied ? "booked" : "available"}`}
                      >
                        {occupied ? "Booked" : time}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CustomerShell>
      )}

      {stage === "menu" && (
        <CustomerShell
          step="03"
          eyebrow="SELECT A MENU"
          title="Choose your service"
          subtitle={`${booking.stylist} · ${booking.date} at ${booking.time}`}
          back={() => go("schedule")}
        >
          <div className="serviceList">
            {services.map((service) => (
              <button
                key={service.name}
                className={`serviceCard ${booking.service === service.name ? "selected" : ""}`}
                onClick={() => {
                  setBooking({ ...booking, service: service.name });
                  go("customer");
                }}
              >
                <span>
                  <b>{service.name}</b>
                  <small>{service.note}</small>
                  <em>{service.duration} min</em>
                </span>
                <strong>{money(service.price)}</strong>
              </button>
            ))}
          </div>
        </CustomerShell>
      )}

      {stage === "customer" && (
        <CustomerShell
          step="04"
          eyebrow="CONFIRM YOUR BOOKING"
          title="Almost finished"
          subtitle="Enter your name and confirm the appointment."
          back={() => go("menu")}
        >
          <div className="confirmGrid">
            <section className="card formCard">
              <label>
                Your name
                <input
                  value={booking.customer}
                  onChange={(event) => setBooking({ ...booking, customer: event.target.value })}
                  required
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button
                className="primary"
                disabled={loading || !booking.customer.trim()}
                onClick={submitBooking}
              >
                {loading ? "Confirming…" : "Confirm appointment"}
              </button>
              <p className="privacyNote">Your booking will be sent securely to the salon.</p>
            </section>

            <aside className="summaryCard">
              <p className="eyebrow">YOUR APPOINTMENT</p>
              <dl>
                <div><dt>Stylist</dt><dd>{booking.stylist}</dd></div>
                <div><dt>Date</dt><dd>{booking.date}</dd></div>
                <div><dt>Time</dt><dd>{booking.time}</dd></div>
                <div><dt>Menu</dt><dd>{booking.service}</dd></div>
                <div><dt>Duration</dt><dd>{selectedService?.duration} min</dd></div>
                <div className="summaryTotal"><dt>Price</dt><dd>{money(serviceFee)}</dd></div>
              </dl>
            </aside>
          </div>
        </CustomerShell>
      )}

      {stage === "approval" && workflow && (
        <OperationsShell
          title="One decision required"
          subtitle="The booking has been coordinated. Only the judgment call remains."
        >
          <div className="columns">
            <div>
              <Panel
                title="AI processing"
                badge={workflow.source === "openai" ? "GPT-5.6 LIVE" : "DEMO MODE"}
              >
                <div className="actionList">
                  {[
                    "Booking structured",
                    "Customer record prepared",
                    "Schedule updated",
                    "Preparation task created",
                  ].map((action, index) => (
                    <div key={action}>
                      <i>✓</i>
                      <span>
                        <b>{action}</b>
                        <small>{index === 2 ? `${workflow.duration}-minute block prepared` : "Completed automatically"}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Booking">
                <dl className="facts">
                  <div><dt>Customer</dt><dd>{workflow.customer}</dd></div>
                  <div><dt>Service</dt><dd>{workflow.service}</dd></div>
                  <div><dt>Stylist</dt><dd>{workflow.stylist}</dd></div>
                  <div><dt>When</dt><dd>{workflow.date} · {workflow.time}</dd></div>
                </dl>
              </Panel>
            </div>

            <aside className="decision">
              <span>!</span>
              <p className="eyebrow">HUMAN JUDGMENT</p>
              <h2>Approval required</h2>
              <p>Color formula has not been selected.</p>
              <div><small>AI SUGGESTION</small><b>{workflow.suggestion}</b></div>
              <button className="primary" onClick={() => go("visit")}>Approve suggestion</button>
              <button className="secondary">Change</button>
            </aside>
          </div>
        </OperationsShell>
      )}

      {stage === "visit" && (
        <OperationsShell title="Customer arrival" subtitle="The prepared workflow is ready for check-in.">
          <div className="columns">
            <Panel title="Today’s visit" badge="READY">
              <dl className="facts">
                <div><dt>Customer</dt><dd>{booking.customer}</dd></div>
                <div><dt>Appointment</dt><dd>{booking.time}</dd></div>
                <div><dt>Service</dt><dd>{booking.service}</dd></div>
                <div><dt>Previous visit</dt><dd>May 26, 2026</dd></div>
              </dl>
              <label>
                Actual arrival time
                <input type="time" value={arrival} onChange={(event) => setArrival(event.target.value)} />
              </label>
              <button
                className="primary"
                onClick={() => {
                  if (!arrival) setArrival(booking.time);
                  go("service");
                }}
              >
                Check in customer
              </button>
            </Panel>

            <Panel title="Customer context" badge="HISTORY READY">
              <div className="note">
                <b>Previous service</b>
                <p>Cut + partial color · Warm Brown 7</p>
                <b>Customer note</b>
                <p>Protect lightened ends. Prefers low-maintenance finish.</p>
              </div>
            </Panel>
          </div>
        </OperationsShell>
      )}

      {stage === "service" && (
        <OperationsShell
          title="Service in progress"
          subtitle="Record what happened; L’avian Core prepares checkout and history."
        >
          <div className="columns">
            <Panel title="Service record" badge="IN SERVICE">
              <dl className="facts">
                <div><dt>Service</dt><dd>{booking.service}</dd></div>
                <div><dt>Stylist</dt><dd>{booking.stylist}</dd></div>
                <div><dt>Color formula</dt><dd>{workflow?.suggestion}</dd></div>
                <div><dt>Assistant</dt><dd>Emi Tanaka</dd></div>
              </dl>
              <label>
                Service notes
                <textarea value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} />
              </label>
            </Panel>

            <Panel title="Added option">
              <label>
                Option
                <select value={option} onChange={(event) => setOption(event.target.value)}>
                  <option>Color protect treatment</option>
                  <option>Scalp care</option>
                  <option>None</option>
                </select>
              </label>
              <label>
                Option charge
                <input type="number" value={optionFee} onChange={(event) => setOptionFee(Number(event.target.value))} />
              </label>
              <button className="primary" onClick={() => go("checkout")}>Prepare checkout →</button>
            </Panel>
          </div>
        </OperationsShell>
      )}

      {stage === "checkout" && (
        <OperationsShell
          title="Checkout & retail"
          subtitle="One payment updates revenue, inventory, customer history, and the dashboard."
        >
          <div className="checkoutGrid">
            <div>
              <Panel title="Retail products" badge="LIVE INVENTORY">
                <div className="products">
                  {products.map((product) => (
                    <div key={product.id}>
                      <div>
                        <b>{product.name}</b>
                        <small>{product.sku} · {product.stock} in stock · {money(product.price)}</small>
                      </div>
                      <div className="qty">
                        <button onClick={() => changeQuantity(product.id, -1)}>−</button>
                        <b>{product.qty}</b>
                        <button onClick={() => changeQuantity(product.id, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Payment">
                <div className="grid2">
                  <label>
                    Discount
                    <input type="number" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
                  </label>
                  <label>
                    Payment method
                    <select value={payment} onChange={(event) => setPayment(event.target.value)}>
                      <option>Card</option>
                      <option>Cash</option>
                      <option>Mobile payment</option>
                    </select>
                  </label>
                </div>
              </Panel>
            </div>

            <aside className="receipt">
              <p className="eyebrow">FINAL CHECKOUT</p>
              <h2>{booking.customer}</h2>
              <dl>
                <div><dt>Service</dt><dd>{money(serviceFee)}</dd></div>
                <div><dt>Option</dt><dd>{money(optionFee)}</dd></div>
                <div><dt>Retail products</dt><dd>{money(productTotal)}</dd></div>
                <div><dt>Discount</dt><dd>−{money(discount)}</dd></div>
                <div><dt>Tax</dt><dd>{money(tax)}</dd></div>
                <div className="total"><dt>Final amount</dt><dd>{money(total)}</dd></div>
              </dl>
              <button className="primary" onClick={finishWorkflow} disabled={syncing}>
                {syncing ? "Syncing…" : "Complete payment"}
              </button>
              <small>Inventory is reduced only after payment completes.</small>
            </aside>
          </div>
        </OperationsShell>
      )}

      {stage === "complete" && (
        <OperationsShell
          title="Workflow completed"
          subtitle="The customer has left. Post-visit operations are prepared and recorded."
        >
          <Panel title="Store dashboard" badge={synced ? "GOOGLE SHEETS SYNCED" : "SYNC STATUS"}>
            <div className="dashboardGrid">
              <DashboardMetric label="Today’s bookings" value="1" detail="Coordinated" />
              <DashboardMetric label="Needs approval" value="0" detail="Decision resolved" />
              <DashboardMetric label="Completed workflows" value="1" detail="Today" />
              <DashboardMetric label="Today’s sales" value={money(total)} detail={`${payment} · paid`} />
              <DashboardMetric label="Payment status" value="Paid" detail={`${payment} · received`} />
              <DashboardMetric label="Next visit" value="6–8 weeks" detail={booking.customer} />
            </div>
            <div className="dashboardStatusRow">
              <span><b>Customer record</b><small>{booking.customer} · history updated</small></span>
              <span><b>Inventory status</b><small>Low-stock and reorder states calculated</small></span>
              <span><b>Google Sheets sync</b><small>{synced ? "Live record saved" : "Demo record prepared"}</small></span>
            </div>
          </Panel>

          <div className="completeGrid">
            <Panel title="Completed automatically" badge="0 DECISIONS LEFT">
              <div className="actionList">
                {[
                  "Payment and final received amount recorded",
                  "Customer history updated",
                  "Service and retail details saved",
                  "Inventory automatically reduced",
                  "Low-stock alerts and reorder candidates prepared",
                  "Dashboard and workflow history updated",
                ].map((action) => (
                  <div key={action}><i>✓</i><span><b>{action}</b></span></div>
                ))}
              </div>
            </Panel>

            <Panel title="Inventory status" badge="UPDATED">
              <div className="inventory">
                {products.map((product) => (
                  <div key={product.id}>
                    <span><b>{product.name}</b><small>{product.stock} remaining</small></span>
                    <em className={product.stock === 0 ? "out" : product.stock <= product.threshold ? "low" : "ok"}>
                      {product.stock === 0 ? "OUT OF STOCK" : product.stock <= product.threshold ? "REORDER CANDIDATE" : "IN STOCK"}
                    </em>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Customer history" badge="SAVED">
              <dl className="facts">
                <div><dt>This visit</dt><dd>{booking.service}</dd></div>
                <div><dt>Payment</dt><dd>{money(total)} · {payment}</dd></div>
                <div><dt>Next visit</dt><dd>6–8 weeks</dd></div>
                <div><dt>Spreadsheet</dt><dd>{synced ? "Synced" : "Demo record prepared"}</dd></div>
              </dl>
            </Panel>
          </div>
          <div className="architectureNote">
            <p className="eyebrow">EXTENSIBLE ARCHITECTURE</p>
            <h2>Connect the tools already used in the business.</h2>
            <p>Compatible APIs and webhooks can connect calendars, POS, payment devices, scanners, printers, delivery systems, and other tools to the same coordinated workflow.</p>
            <small>This Build Week demo currently demonstrates live integration with OpenAI and Google Sheets. Other device and service connections are architectural extensions and are not implemented in this demo.</small>
          </div>
          <div className="architectureNote mutedNote">
            <p className="eyebrow">ONE CORE, MANY OPERATIONS</p>
            <h2>Endlessly extensible. Structurally repeatable.</h2>
            <p>The same Core can coordinate attendance, shifts, payroll preparation, accounting, invoicing, and tax-preparation workflows. Payroll, accounting, and tax-related actions remain subject to human approval, local regulations, and the connected service.</p>
          </div>
          <button className="primary centered" onClick={restart}>Run demo again</button>
        </OperationsShell>
      )}

      <footer>
        <b>L’avian Core</b>
        <span>Quiet customer experience. Coordinated operations.</span>
        <small>Build Week demo · Synthetic data</small>
      </footer>
    </main>
  );
}

function SiteHome({ onStart }: { onStart: () => void }) {
  return (
    <section className="sitePage">
      <nav className="siteNav" aria-label="Salon website navigation">
        <span className="siteWordmark">L’avian <i>salon</i></span>
        <div><a href="#services">Services</a><a href="#studio">The studio</a><button onClick={onStart}>Book now</button></div>
      </nav>

      <div className="siteHero">
        <div className="siteHeroCopy">
          <p className="eyebrow">A QUIET PLACE FOR YOUR NEXT CHAPTER</p>
          <h1>Colour, cut, and care — considered together.</h1>
          <p>Thoughtful salon appointments, shaped around you. Behind every calm customer experience, L’avian Core coordinates the work that keeps the studio moving.</p>
          <div className="siteActions"><button className="primary" onClick={onStart}>Book an appointment</button><button className="siteTextButton" onClick={onStart}>Send an inquiry <span>↗</span></button></div>
        </div>
        <div className="siteHeroCard"><span>20</span><p>years of quiet craft</p><small>Yuko Sato · Color specialist</small></div>
      </div>

      <div className="siteNotice">
        <b>This demo begins with a website inquiry.</b>
        <span>The same workflow can also begin from LINE, email, messaging apps, web forms, or other connected channels.</span>
      </div>

      <div className="siteSection" id="services">
        <div><p className="eyebrow">THE L’AVIAN MENU</p><h2>Simple choices. Considered results.</h2></div>
        <div className="siteCards">
          <article><span>01</span><h3>Cut + Color</h3><p>Consultation, cut and full colour, with time for the details.</p><b>from $140</b></article>
          <article><span>02</span><h3>Haircut</h3><p>A precise cut, shampoo and finish for everyday ease.</p><b>from $65</b></article>
          <article><span>03</span><h3>Treatment</h3><p>Intensive repair care for a softer, healthier finish.</p><b>from $70</b></article>
        </div>
      </div>

      <div className="siteSection splitSection" id="studio">
        <div><p className="eyebrow">THE STUDIO</p><h2>Human attention, fewer admin decisions.</h2></div>
        <div><p>One request in. A coordinated business workflow out. Human judgment only where it matters.</p><p>L’avian Core turns the customer’s request into structured work for the salon team — booking, preparation, arrival, service, payment, inventory, history and records.</p></div>
      </div>

      <div className="siteCoreCard">
        <div><p className="eyebrow">THE OPERATING LAYER BEHIND THE EXPERIENCE</p><h2>AI is not just answering questions. It is coordinating operations.</h2></div>
        <div className="corePills"><span>Customer experience</span><i>→</i><span>AI coordination</span><i>→</i><span>Human approval</span><i>→</i><span>Business operations</span></div>
      </div>

      <div className="siteSection expansionSection">
        <div><p className="eyebrow">READY TO GROW WITH THE BUSINESS</p><h2>One Core. Repeatable across industries. Expandable across operations.</h2></div>
        <div className="expansionCopy"><p>With compatible APIs or webhooks, the same workflow can connect the tools already used in a business.</p><p className="smallCopy">Live in this demo: OpenAI and Google Sheets. Other services and devices represent the extensible architecture and are not implemented here.</p><button className="primary" onClick={onStart}>Explore the workflow</button></div>
      </div>
    </section>
  );
}

function DashboardMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="dashboardMetric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}

function CustomerProgress({ stage }: { stage: Stage }) {
  const items: [Stage, string][] = [
    ["stylist", "Stylist"],
    ["schedule", "Date & time"],
    ["menu", "Menu"],
    ["customer", "Confirm"],
  ];
  const index = items.findIndex(([value]) => value === stage);

  return (
    <nav className="customerProgress">
      {items.map(([value, label], itemIndex) => (
        <div key={value} className={itemIndex < index ? "done" : itemIndex === index ? "active" : ""}>
          <i>{itemIndex < index ? "✓" : itemIndex + 1}</i>
          <span>{label}</span>
        </div>
      ))}
    </nav>
  );
}

function OperationsProgress({ stage }: { stage: Stage }) {
  const items: [Stage, string][] = [
    ["approval", "Approval"],
    ["visit", "Visit"],
    ["service", "Service"],
    ["checkout", "Checkout"],
    ["complete", "Complete"],
  ];
  const index = items.findIndex(([value]) => value === stage);

  return (
    <nav className="steps">
      {items.map(([value, label], itemIndex) => (
        <div key={value} className={itemIndex < index ? "done" : itemIndex === index ? "active" : ""}>
          <i>{itemIndex < index ? "✓" : itemIndex + 1}</i>
          <span>{label}</span>
        </div>
      ))}
    </nav>
  );
}

function CustomerShell({
  step,
  eyebrow,
  title,
  subtitle,
  back,
  children,
}: {
  step: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  back?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="customerPage">
      <div className="customerHeading">
        {back && <button className="backButton" onClick={back}>← Back</button>}
        <p className="eyebrow">{eyebrow}</p>
        <span>{step}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function OperationsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace">
      <div className="pageTitle">
        <p className="eyebrow">OPERATIONS WORKFLOW</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card panel">
      <div className="panelHead">
        <h2>{title}</h2>
        {badge && <span>{badge}</span>}
      </div>
      {children}
    </article>
  );
}
