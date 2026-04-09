let selectedRole = null;

function setRole(role) {
  selectedRole = role;

  document.getElementById("roleText").innerText =
    role === "commuter"
      ? "🚶 Commuter selected"
      : "🛺 Driver selected";

  const plateInput = document.getElementById("plateNumber");

  if (role === "driver") {
    plateInput.style.display = "block";
  } else {
    plateInput.style.display = "none";
    plateInput.value = "";
  }
}

function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const plateNumber = document.getElementById("plateNumber").value.trim();
  const idType = document.getElementById("idType").value;
  const file = document.getElementById("idFile").files[0];

  if (!name || !email || !password || !selectedRole || !file || !idType) {
    alert("Please fill all required fields");
    return;
  }

  if (selectedRole === "driver" && !plateNumber) {
    alert("Motorcycle plate number is required for drivers");
    return;
  }

  // IMAGE TYPE CHECK
  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    return;
  }

  // IMAGE SIZE CHECK (500 KB)
  if (file.size > 500 * 1024) {
    alert("❌ Image too large. Please upload under 500 KB");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64Image = reader.result;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((cred) => {
        const userData = {
          name: name,
          role: selectedRole,
          verification: {
            status: "auto_verified", // prototype
            idType: idType,
            idImage: base64Image
          }
        };

        // ONLY drivers have plate number
        if (selectedRole === "driver") {
          userData.plateNumber = plateNumber;
        }

        return firebase.database()
          .ref("users/" + cred.user.uid)
          .set(userData);
      })
      .then(() => {
        alert("Registered successfully!");
        window.location.href = "index.html";
      })
      .catch(err => alert(err.message));
  };

  reader.readAsDataURL(file);
}
