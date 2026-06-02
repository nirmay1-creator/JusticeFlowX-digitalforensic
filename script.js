const criminalDatabase = {
  "FP1001": { name: "Rahul Sharma", criminal: true },
  "FP1002": { name: "Amit Verma", criminal: false },
  "FP1003": { name: "Sneha Patil", criminal: false },
  "FP1004": { name: "Rakesh Mehta", criminal: true }
};

function startScan() {
  const scanLine = document.querySelector(".scan-line");
  const result = document.getElementById("result");
  const id = document.getElementById("fingerId").value.trim();

  if (!id) {
    result.innerHTML = "⚠️ Please enter Fingerprint ID";
    result.style.color = "yellow";
    return;
  }

  result.innerHTML = "Scanning fingerprint...";
  result.style.color = "cyan";

  scanLine.style.display = "block";

  setTimeout(() => {
    scanLine.style.display = "none";

    if (criminalDatabase[id]) {
      const person = criminalDatabase[id];
      if (person.criminal) {
        result.innerHTML = `❌ Criminal Record Found<br>Name: ${person.name}`;
        result.style.color = "red";
      } else {
        result.innerHTML = `✅ Identity Verified<br>Name: ${person.name}<br>No Criminal Record`;
        result.style.color = "lime";
      }
    } else {
      result.innerHTML = "❌ No record found in database";
      result.style.color = "orange";
    }
  }, 3000);
}
