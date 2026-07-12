import React from "react";

function AboutUs() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>About KaamHub</h1>

      <p>
        KaamHub is a trusted home service platform that connects customers with
        verified local service professionals. Our goal is to provide fast,
        reliable, and affordable home services.
      </p>

      <h2>Our Mission</h2>
      <p>
        To make home services simple, transparent, and accessible for everyone.
      </p>

      <h2>Services</h2>
      <ul>
        <li>Electrician</li>
        <li>Plumber</li>
        <li>AC Repair</li>
        <li>Cleaning</li>
        <li>Carpenter</li>
        <li>Painting</li>
      </ul>

      <h2>Contact</h2>
      <p>Email: support@kaamhub.in</p>
      <p>Website: https://kaamhub.in</p>
    </div>
  );
}

export default AboutUs;
