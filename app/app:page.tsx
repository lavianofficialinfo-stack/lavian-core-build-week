"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Stage =
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
  const [stage, setStage] = useState<Stage>("stylist");
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
    go("stylist");
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

      {customerStage ? (
        <CustomerProgress stage={stage} />
      ) : (
        <OperationsProgress stage={stage} />
      )}

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
