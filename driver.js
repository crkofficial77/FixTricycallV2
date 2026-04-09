let map;
let driverMarker = null;
let pickupMarker = null;
let routeLine = null;
let currentPickup = null;
let currentRequestId = null;
let DRIVER_ID = null;

// ================= ICONS =================


// ICONS
const commuterIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

// TRICYCLE / TUKTUK ICON
const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2554/2554936.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// ================= INIT MAP =================
function initMap(lat = 14.5995, lng = 120.9842) {
  map = L.map("map").setView([lat, lng], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
}

// ================= AUTH =================
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  DRIVER_ID = user.uid;

  firebase.database().ref("drivers/" + DRIVER_ID).update({
    online: true
  });

  startLocation();
});

// ================= LOCATION SHARE =================
function startLocation() {
  navigator.geolocation.watchPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    firebase.database().ref("drivers/" + DRIVER_ID).update({
      lat, lng, online: true
    });

    if (!map) initMap(lat, lng);

    if (!driverMarker) {
      driverMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(map)
        .bindPopup("You (Driver)");
    } else {
      driverMarker.setLatLng([lat, lng]);
    }

    drawRoute([lat, lng]);
  });
}

// ================= REQUEST LISTEN =================
firebase.database().ref("requests").on("child_added", snap => {
  const req = snap.val();

  if (req.status === "pending" && !currentRequestId) {
    showRequest(snap.key, req);
  }
});

firebase.database().ref("requests").on("child_removed", snap => {
  if (snap.key === currentRequestId) {
    clearRide();
  }
});

// ================= SHOW REQUEST =================
function showRequest(id, req) {
  if (pickupMarker) return;

  pickupMarker = L.marker([req.lat, req.lng], { icon: pickupIcon }).addTo(map)
    .bindPopup("Pickup Location");

  const btn = document.createElement("button");
  btn.className = "driver-button";
  btn.id = "acceptBtn";
  btn.innerText = "Accept Ride";
  btn.onclick = () => acceptRequest(id, req);

  document.getElementById("requests").appendChild(btn);
}

// ================= ACCEPT =================
function acceptRequest(id, req) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  firebase.database().ref("requests/" + id).update({
    status: "accepted",
    driverUid: user.uid
  });

  currentRequestId = id;
  currentPickup = [req.lat, req.lng];

  // REMOVE accept button
  const btn = document.getElementById("acceptBtn");
  if (btn) btn.remove();

  showArriveButton();

  alert("Ride accepted!");
}

// ================= ARRIVE BUTTON =================
function showArriveButton() {
  const btn = document.createElement("button");
  btn.className = "driver-button";
  btn.id = "arriveBtn";
  btn.innerText = "Arrived";

  btn.onclick = () => {
    firebase.database().ref("requests/" + currentRequestId).remove();
    clearRide();
    alert("Ride completed!");
  };

  document.getElementById("requests").appendChild(btn);
}

// ================= ROUTE =================
function drawRoute(driverLoc) {
  if (!currentPickup) return;

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline([driverLoc, currentPickup], {
    color: "purple"
  }).addTo(map);
}

// ================= CLEAR =================
function clearRide() {
  currentPickup = null;
  currentRequestId = null;

  if (pickupMarker) {
    map.removeLayer(pickupMarker);
    pickupMarker = null;
  }

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const arriveBtn = document.getElementById("arriveBtn");
  if (arriveBtn) arriveBtn.remove();
}

// ================= INIT =================
navigator.geolocation.getCurrentPosition(
  pos => initMap(pos.coords.latitude, pos.coords.longitude),
  () => initMap()
);
