import { useState } from "react";

const initial = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  taxId: "",
  phone: "",
  website: "",
  about: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "United Kingdom",
  state: "",
  zip: "",
};

const COUNTRIES = ["United Kingdom", "United States", "Ukraine", "Germany", "France", "Australia", "Canada"];

export default function WholesaleForm({ onSubmit }) {
  const [data, setData] = useState(initial);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.(data);
  };

  return (
    <form className="wf" onSubmit={submit}>
      <h1 className="wf__title">Create a Wholesale Account</h1>
      <div className="wf__login">Already have an account? Login here.</div>

      <h2 className="wf__section">Customer Information</h2>

      <div className="wf__row">
        <input className="wf__input" placeholder="First Name" value={data.firstName} onChange={set("firstName")} />
        <input className="wf__input" placeholder="Last Name"  value={data.lastName}  onChange={set("lastName")} />
      </div>
      <div className="wf__row">
        <input className="wf__input" placeholder="Email" type="email" value={data.email} onChange={set("email")} />
        <input className="wf__input" placeholder="Company Name" value={data.companyName} onChange={set("companyName")} />
      </div>
      <div className="wf__row">
        <input className="wf__input" placeholder="Tax ID/ABN/VAT Number" value={data.taxId} onChange={set("taxId")} />
        <input className="wf__input" placeholder="Phone Number" value={data.phone} onChange={set("phone")} />
      </div>
      <div className="wf__row">
        <input className="wf__input" placeholder="Website" value={data.website} onChange={set("website")} />
      </div>
      <textarea
        className="wf__textarea"
        placeholder="Tell us a little about yourself so that we can verify your business identity."
        value={data.about}
        onChange={set("about")}
        rows={4}
      />

      <h2 className="wf__section">Shipping Address</h2>
      <input className="wf__input" placeholder="Address Line 1" value={data.addressLine1} onChange={set("addressLine1")} />
      <input className="wf__input" placeholder="Address Line 2" value={data.addressLine2} onChange={set("addressLine2")} />

      <div className="wf__row">
        <div className="wf__field">
          <label className="wf__label">CITY</label>
          <input className="wf__input" placeholder="City" value={data.city} onChange={set("city")} />
        </div>
        <div className="wf__field">
          <label className="wf__label">COUNTRY</label>
          <select className="wf__input" value={data.country} onChange={set("country")}>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="wf__row">
        <div className="wf__field">
          <label className="wf__label">STATE/PROVINCE</label>
          <input className="wf__input" placeholder="State / Province" value={data.state} onChange={set("state")} />
        </div>
        <div className="wf__field">
          <label className="wf__label">ZIP/POSTAL CODE</label>
          <input className="wf__input" placeholder="Zip/postal code" value={data.zip} onChange={set("zip")} />
        </div>
      </div>

      <button type="submit" className="wf__submit">CONTINUE</button>
    </form>
  );
}
