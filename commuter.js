let map;
let marker;
let driverMarkers = {};
let currentRequestId = null;

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

// MAP
function initMap(lat, lng) {
  map = L.map("map").setView([lat, lng], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  marker = L.marker([lat, lng], { icon: commuterIcon }).addTo(map)
    .bindPopup("You (Commuter)");
}

// LOAD
window.onload = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    initMap(pos.coords.latitude, pos.coords.longitude);
    listenDrivers();
  });
};

// DRIVERS
function listenDrivers() {
  firebase.database().ref("drivers").on("value", snap => {
    if (!snap.exists()) return;

    const drivers = snap.val();

    Object.keys(drivers).forEach(uid => {
      const d = drivers[uid];
      if (!d.lat) return;

      if (!driverMarkers[uid]) {
        driverMarkers[uid] = L.marker([d.lat, d.lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup("Tricycle Driver");
      } else {
        driverMarkers[uid].setLatLng([d.lat, d.lng]);
      }
    });
  });
}

// REQUEST
function requestTricycle() {
  const user = firebase.auth().currentUser;
  if (!user || !marker) return;

  const pos = marker.getLatLng();

  const ref = firebase.database().ref("requests").push({
    uid: user.uid,
    lat: pos.lat,
    lng: pos.lng,
    status: "pending"
  });

  currentRequestId = ref.key;

  alert("Request sent!");
}

// CANCEL
function cancelRequest() {
  if (!currentRequestId) return;

  firebase.database().ref("requests/" + currentRequestId).remove();
  alert("Cancelled");
}