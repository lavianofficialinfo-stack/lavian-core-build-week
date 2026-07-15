"use client";

import { useMemo, useState } from "react";

type Stage =
  | "booking"
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

const initialBooking: Booking = {
  customer: "Hana Yamada",
  service: "Cut + Color",
  stylist: "Yuko Sato",
  date: "2026-07-20",
  time: "15:00",
};

const initialProducts: Product[] = [
  {
    id: "P-101",
    name: "Color Protect Shampoo",
    sku: "CPS-250",
    price: 28,
    stock: 8,
    threshold: 5,
    qty: 0,
  },
  {
    id: "P-102",
    name: "Repair Treatment",
    sku: "RPT-200",
    price: 34,
    stock: 3,
    threshold: 3,
    qty: 0,
  },
  {
    id: "P-103",
    name: "Silk Hair Oil",
    sku: "SHO-050",
    price: 24,
    stock: 1,
    threshold: 2,
    qty: 0,
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export default function Home() {
  const [stage, setStage] = useState<Stage>("booking");
  const [booking, setBooking] = useState(initialBooking);
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

  const serviceFee =
    booking.service === "Cut + Color"
      ? 140
      : booking.service === "Color"
        ? 110
        : booking.service === "Treatment"
          ? 70
          : 65;

  const productTotal = useMemo(
    () => products.reduce((sum, product) => sum + product.price * product.qty, 0),
    [products],
  );

  const subtotal = serviceFee + optionFee + productTotal - discount;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + tax;

  const steps: [Stage, string][] = [
    ["booking", "Booking"],
    ["approval", "AI approval"],
    ["visit", "Visit"],
    ["service", "Service"],
    ["checkout", "Checkout"],
    ["complete", "Complete"],
  ];

  const stageIndex = steps.findIndex(([step]) => step === stage);

  async function processBooking(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(booking),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setWorkflow(data);
      setStage("approval");
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
          ? {
              ...product,
              qty: Math.max(
                0,
                Math.min(product.stock, product.qty + difference),
              ),
            }
          : product,
      ),
    );
  }

  async function finishWorkflow() {
    const completedAt = new Date().toISOString();

    const payload = {
      booking,
      workflow,
      visit: {
        arrival,
        serviceNotes,
        option,
      },
      checkout: {
        serviceFee,
        optionFee,
        productTotal,
        discount,
        tax,
        total,
        payment,
      },
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
      current.map((product) => ({
        ...product,
        stock: product.stock - product.qty,
        qty: 0,
      })),
    );

    setStage("complete");
  }

  function restart() {
    setStage("booking");
    setBooking(initialBooking);
    setWorkflow(null);
    setArrival("");
    setProducts(initialProducts);
    setSynced(false);
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={restart}>
          <span>L’</span>avian Core
        </button>

        <div className="live">
          {workflow?.source === "openai"
            ? "● GPT-5.6 LIVE"
            : "● DEMO MODE"}
        </div>

        <button className="linkButton" onClick={restart}>
          Restart
        </button>
      </header>

      <nav className="steps">
        {steps.map(([step, label], index) => (
          <div
            className={
              index < stageIndex
                ? "done"
                : index === stageIndex
                  ? "active"
                  : ""
            }
            key={step}
          >
            <i>{index < stageIndex ? "✓" : index + 1}</i>
            <span>{label}</span>
          </div>
        ))}
      </nav>

      {stage === "booking" && (
        <section className="hero">
          <div className="pitch">
            <p className="eyebrow">BEAUTY SALON OPERATIONS DEMO</p>
            <h1>
              One request in.
              <br />
              <em>A coordinated workflow out.</em>
            </h1>
            <p>
              From booking to payment, inventory, and customer history—AI
              coordinates the repetitive work and isolates human judgment.
            </p>

            <div className="impact">
              <b>9</b>
              <span>manual steps</span>
              <strong>→</strong>
              <b>1</b>
              <span>human decision</span>
            </div>
          </div>

          <form className="card form" onSubmit={processBooking}>
            <div className="cardTitle">
              <div>
                <p className="eyebrow">CUSTOMER BOOKING</p>
                <h2>Book an appointment</h2>
              </div>
              <span>01</span>
            </div>

            <label>
              Customer
              <input
                value={booking.customer}
                onChange={(event) =>
                  setBooking({
                    ...booking,
                    customer: event.target.value,
                  })
                }
                required
              />
            </label>

            <div className="grid2">
              <label>
                Service
                <select
                  value={booking.service}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      service: event.target.value,
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
                      stylist: event.target.value,
                    })
                  }
                >
                  <option>Yuko Sato</option>
                  <option>Mia Chen</option>
                </select>
              </label>
            </div>

            <div className="grid2">
              <label>
                Date
                <input
                  type="date"
                  value={booking.date}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      date: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Time
                <select
                  value={booking.time}
                  onChange={(event) =>
                    setBooking({
                      ...booking,
                      time: event.target.value,
                    })
                  }
                >
                  <option value="10:00">10:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                </select>
              </label>
            </div>

            {error && <p className="error">{error}</p>}

            <button className="primary" disabled={loading}>
              {loading ? "Coordinating workflow…" : "Submit booking →"}
            </button>
          </form>
        </section>
      )}

      {stage === "approval" && workflow && (
        <Shell
          title="One decision required"
          subtitle="AI completed the coordination work and isolated the only judgment call."
        >
          <div className="columns">
            <div>
              <Panel
                title="AI processing"
                badge={
                  workflow.source === "openai"
                    ? "GPT-5.6 LIVE"
                    : "DEMO MODE"
                }
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
                        <small>
                          {index === 2
                            ? `${workflow.duration}-minute block prepared`
                            : "Completed automatically"}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Booking">
                <dl className="facts">
                  <div>
                    <dt>Customer</dt>
                    <dd>{workflow.customer}</dd>
                  </div>
                  <div>
                    <dt>Service</dt>
                    <dd>{workflow.service}</dd>
                  </div>
                  <div>
                    <dt>Stylist</dt>
                    <dd>{workflow.stylist}</dd>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>
                      {workflow.date} · {workflow.time}
                    </dd>
                  </div>
                </dl>
              </Panel>
            </div>

            <aside className="decision">
              <span>!</span>
              <p className="eyebrow">HUMAN JUDGMENT</p>
              <h2>Approval required</h2>
              <p>Color formula has not been selected.</p>

              <div>
                <small>AI SUGGESTION</small>
                <b>{workflow.suggestion}</b>
              </div>

              <button
                className="primary"
                onClick={() => setStage("visit")}
              >
                Approve suggestion
              </button>

              <button className="secondary">Change</button>
            </aside>
          </div>
        </Shell>
      )}

      {stage === "visit" && (
        <Shell
          title="Customer arrival"
          subtitle="The prepared workflow is ready for check-in."
        >
          <div className="columns">
            <Panel title="Today’s visit" badge="READY">
              <dl className="facts">
                <div>
                  <dt>Customer</dt>
                  <dd>{booking.customer}</dd>
                </div>
                <div>
                  <dt>Appointment</dt>
                  <dd>{booking.time}</dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd>{booking.service}</dd>
                </div>
                <div>
                  <dt>Previous visit</dt>
                  <dd>May 26, 2026</dd>
                </div>
              </dl>

              <label>
                Actual arrival time
                <input
                  type="time"
                  value={arrival}
                  onChange={(event) => setArrival(event.target.value)}
                />
              </label>

              <button
                className="primary"
                onClick={() => {
                  if (!arrival) setArrival(booking.time);
                  setStage("service");
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
                <p>
                  Protect lightened ends. Prefers low-maintenance finish.
                </p>
              </div>
            </Panel>
          </div>
        </Shell>
      )}

      {stage === "service" && (
        <Shell
          title="Service in progress"
          subtitle="Record what happened; L’avian Core prepares checkout and history."
        >
          <div className="columns">
            <Panel title="Service record" badge="IN SERVICE">
              <dl className="facts">
                <div>
                  <dt>Service</dt>
                  <dd>{booking.service}</dd>
                </div>
                <div>
                  <dt>Stylist</dt>
                  <dd>{booking.stylist}</dd>
                </div>
                <div>
                  <dt>Color formula</dt>
                  <dd>{workflow?.suggestion}</dd>
                </div>
                <div>
                  <dt>Assistant</dt>
                  <dd>Emi Tanaka</dd>
                </div>
              </dl>

              <label>
                Service notes
                <textarea
                  value={serviceNotes}
                  onChange={(event) =>
                    setServiceNotes(event.target.value)
                  }
                />
              </label>
            </Panel>

            <Panel title="Added option">
              <label>
                Option
                <select
                  value={option}
                  onChange={(event) => setOption(event.target.value)}
                >
                  <option>Color protect treatment</option>
                  <option>Scalp care</option>
                  <option>None</option>
                </select>
              </label>

              <label>
                Option charge
                <input
                  type="number"
                  value={optionFee}
                  onChange={(event) =>
                    setOptionFee(Number(event.target.value))
                  }
                />
              </label>

              <button
                className="primary"
                onClick={() => setStage("checkout")}
              >
                Prepare checkout →
              </button>
            </Panel>
          </div>
        </Shell>
      )}

      {stage === "checkout" && (
        <Shell
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
                        <small>
                          {product.sku} · {product.stock} in stock ·{" "}
                          {money(product.price)}
                        </small>
                      </div>

                      <div className="qty">
                        <button
                          onClick={() =>
                            changeQuantity(product.id, -1)
                          }
                        >
                          −
                        </button>
                        <b>{product.qty}</b>
                        <button
                          onClick={() =>
                            changeQuantity(product.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Payment">
                <div className="grid2">
                  <label>
                    Discount
                    <input
                      type="number"
                      value={discount}
                      onChange={(event) =>
                        setDiscount(Number(event.target.value))
                      }
                    />
                  </label>

                  <label>
                    Payment method
                    <select
                      value={payment}
                      onChange={(event) =>
                        setPayment(event.target.value)
                      }
                    >
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
                <div>
                  <dt>Service</dt>
                  <dd>{money(serviceFee)}</dd>
                </div>
                <div>
                  <dt>Option</dt>
                  <dd>{money(optionFee)}</dd>
                </div>
                <div>
                  <dt>Retail products</dt>
                  <dd>{money(productTotal)}</dd>
                </div>
                <div>
                  <dt>Discount</dt>
                  <dd>−{money(discount)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>{money(tax)}</dd>
                </div>
                <div className="total">
                  <dt>Final amount</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>

              <button className="primary" onClick={finishWorkflow}>
                Complete payment
              </button>

              <small>
                Inventory is reduced only after payment completes.
              </small>
            </aside>
          </div>
        </Shell>
      )}

      {stage === "complete" && (
        <Shell
          title="Workflow completed"
          subtitle="The customer has left. Post-visit operations are prepared and recorded."
        >
          <div className="completeGrid">
            <Panel
              title="Completed automatically"
              badge="0 DECISIONS LEFT"
            >
              <div className="actionList">
                {[
                  "Payment and final received amount recorded",
                  "Customer history updated",
                  "Service and retail details saved",
                  "Inventory automatically reduced",
                  "Low-stock alerts and reorder candidates prepared",
                  "Dashboard and workflow history updated",
                ].map((action) => (
                  <div key={action}>
                    <i>✓</i>
                    <span>
                      <b>{action}</b>
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Inventory status" badge="UPDATED">
              <div className="inventory">
                {products.map((product) => (
                  <div key={product.id}>
                    <span>
                      <b>{product.name}</b>
                      <small>{product.stock} remaining</small>
                    </span>

                    <em
                      className={
                        product.stock === 0
                          ? "out"
                          : product.stock <= product.threshold
                            ? "low"
                            : "ok"
                      }
                    >
                      {product.stock === 0
                        ? "OUT OF STOCK"
                        : product.stock <= product.threshold
                          ? "REORDER CANDIDATE"
                          : "IN STOCK"}
                    </em>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Customer history" badge="SAVED">
              <dl className="facts">
                <div>
                  <dt>This visit</dt>
                  <dd>{booking.service}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {money(total)} · {payment}
                  </dd>
                </div>
                <div>
                  <dt>Next visit</dt>
                  <dd>6–8 weeks</dd>
                </div>
                <div>
                  <dt>Spreadsheet</dt>
                  <dd>{synced ? "Synced" : "Demo record prepared"}</dd>
                </div>
              </dl>
            </Panel>
          </div>

          <button className="primary centered" onClick={restart}>
            Run demo again
          </button>
        </Shell>
      )}

      <footer>
        <b>L’avian Core</b>
        <span>
          AI is not just answering questions. It is coordinating operations.
        </span>
        <small>Build Week demo · Synthetic data</small>
      </footer>
    </main>
  );
}

function Shell({
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
