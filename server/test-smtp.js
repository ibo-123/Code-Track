import dns from "dns";

dns.lookup(
  "smtp.gmail.com",
  { family: 4 },
  (err, address) => {
    if (err) {
      console.log(err);
    } else {
      console.log("IPv4:", address);
    }
  }
);