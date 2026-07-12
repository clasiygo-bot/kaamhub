import React from "react";

export default function RefundPolicy() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>Refund Policy</h1>

      <p>
        At KaamHub, customer satisfaction is our priority. This Refund Policy
        explains when refunds may be provided.
      </p>

      <h2>Eligible for Refund</h2>
      <ul>
        <li>Payment deducted but booking was not confirmed.</li>
        <li>Service partner did not arrive.</li>
        <li>Duplicate payment was made.</li>
        <li>Approved refund requests after verification.</li>
      </ul>

      <h2>Non-Refundable Cases</h2>
      <ul>
        <li>Service has already been completed.</li>
        <li>Customer cancels after the partner has arrived.</li>
        <li>Disputes not related to payment.</li>
      </ul>

      <h2>Refund Timeline</h2>
      <p>
        Approved refunds are generally processed within 5–7 business days,
        depending on your payment provider.
      </p>

      <h2>Contact Us</h2>
      <p>Email: support@kaamhub.in</p>
      <p>Website: https://kaamhub.in</p>

      <p>Last Updated: July 2026</p>
    </div>
  );
}
