function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((cred) => {
      return firebase.database().ref("users/" + cred.user.uid).once("value");
    })
    .then((snapshot) => {
      if (!snapshot.exists()) {
        alert("Account not registered");
        firebase.auth().signOut();
        return;
      }

      const user = snapshot.val();

      if (user.verification.status !== "auto_verified") {
        alert("❌ Account not verified yet");
        firebase.auth().signOut();
        return;
      }

      if (user.role === "commuter") {
        window.location.href = "commuter.html";
      } else if (user.role === "driver") {
        window.location.href = "driver.html";
      } else {
        alert("Invalid role");
        firebase.auth().signOut();
      }
    })
    .catch(() => {
      alert("Login failed");
    });
}
