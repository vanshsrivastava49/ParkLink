import { useState } from "react";
import { T } from "../../styles/global";
import { Card, SectionLabel, Input, Btn, Avatar, Divider } from "../../components/UI";

export default function ProfileTab({ user, onUpdateUser, onNotify }) {
  const [form, setForm]         = useState({ ...user });
  const [saving, setSaving]     = useState(false);
  const [changed, setChanged]   = useState(false);
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]   = useState("");

  const f = key => val => {
    setForm(p => ({ ...p, [key]: val }));
    setChanged(true);
  };

  async function saveProfile() {
    if (!form.name.trim())  { onNotify("Name cannot be empty", "err"); return; }
    if (!form.email.trim()) { onNotify("Email cannot be empty", "err"); return; }
    if (!form.phone.trim()) { onNotify("Phone cannot be empty", "err"); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    // Update initials if name changed
    const nameParts = form.name.trim().split(" ");
    const initials = (nameParts[0][0] + (nameParts[1]?.[0] || "")).toUpperCase();
    onUpdateUser({ ...form, avatar: initials });
    setChanged(false);
    setSaving(false);
    onNotify("Profile updated successfully!", "ok");
  }

  function changePassword() {
    setPwError("");
    if (!pwForm.current)  { setPwError("Enter current password"); return; }
    if (pwForm.current !== user.password) { setPwError("Current password is incorrect"); return; }
    if (!pwForm.next)     { setPwError("Enter new password"); return; }
    if (pwForm.next.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match"); return; }

    onUpdateUser({ ...user, password: pwForm.next });
    setPwForm({ current: "", next: "", confirm: "" });
    onNotify("Password changed successfully!", "ok");
  }

  const COLOR_OPTIONS = ["#4f6ff5", "#f59e0b", "#10d98a", "#ff4560", "#22d3ee", "#a855f7", "#ec4899"];

  return (
    <div style={{ animation: "fadeUp .4s ease", maxWidth: 700 }}>

      {/* Avatar & name banner */}
      <Card style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <Avatar initials={form.avatar} color={form.avatarColor} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{form.name}</div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{form.email}</div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>Member since {user.joinedAt}</div>
        </div>

        {/* Avatar color picker */}
        <div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", marginBottom: 8 }}>AVATAR COLOR</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => { setForm(p => ({ ...p, avatarColor: color })); setChanged(true); }}
                style={{
                  width: 24, height: 24, borderRadius: "50%", background: color,
                  border: form.avatarColor === color ? `2px solid ${T.text}` : `2px solid transparent`,
                  cursor: "pointer", transition: "transform .15s",
                  transform: form.avatarColor === color ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Personal details */}
      <SectionLabel>Personal Information</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Input label="FULL NAME"     value={form.name}  onChange={f("name")}  placeholder="Your full name" icon="👤" />
          <Input label="PHONE NUMBER"  value={form.phone} onChange={f("phone")} placeholder="10-digit number" type="tel" icon="📱" />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="EMAIL ADDRESS" value={form.email} onChange={f("email")} placeholder="you@example.com" type="email" icon="✉" />
          </div>
        </div>

        {changed && (
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <Btn onClick={saveProfile} disabled={saving} variant="primary">
              {saving ? "Saving..." : "💾 Save Changes"}
            </Btn>
            <Btn onClick={() => { setForm({ ...user }); setChanged(false); }} variant="ghost">
              Discard
            </Btn>
          </div>
        )}
      </Card>

      {/* Vehicle details */}
      <SectionLabel>Vehicle Information</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Input
            label="VEHICLE TYPE"
            value={form.vehicleType}
            onChange={f("vehicleType")}
            options={[
              { value: "two_wheeler",  label: "🛵 Two Wheeler" },
              { value: "four_wheeler", label: "🚗 Four Wheeler" },
            ]}
          />
          <Input label="VEHICLE NUMBER" value={form.vehicleNumber} onChange={f("vehicleNumber")} placeholder="TN00XX0000" icon="🚘" />
        </div>

        <div style={{ background: T.panel, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: T.muted, marginTop: 8 }}>
          ⚠ Changing vehicle type may affect your slot compatibility. Active bookings are not automatically transferred.
        </div>
      </Card>

      {/* Change password */}
      <SectionLabel>Change Password</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        <Input label="CURRENT PASSWORD" value={pwForm.current} onChange={v => setPwForm(p => ({ ...p, current: v }))} type="password" placeholder="Your current password" icon="🔒" />
        <Input label="NEW PASSWORD"     value={pwForm.next}    onChange={v => setPwForm(p => ({ ...p, next: v }))}    type="password" placeholder="Min. 6 characters" icon="🔑" />
        <Input label="CONFIRM PASSWORD" value={pwForm.confirm} onChange={v => setPwForm(p => ({ ...p, confirm: v }))} type="password" placeholder="Repeat new password" icon="🔑" />

        {pwError && (
          <div style={{ background: T.red + "15", border: `1px solid ${T.red}33`, color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
            ⚠ {pwError}
          </div>
        )}

        <Btn onClick={changePassword} variant="ghost">
          🔒 Update Password
        </Btn>
      </Card>

      {/* Account info (read-only) */}
      <SectionLabel>Account Details</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "User ID",      value: `#${user.id.toString().padStart(4, "0")}` },
            { label: "Joined",       value: user.joinedAt },
            { label: "Vehicle Type", value: user.vehicleType === "two_wheeler" ? "Two Wheeler" : "Four Wheeler" },
            { label: "Status",       value: "Active" },
            { label: "RFID Card",    value: "Linked ✅" }, // <-- NEW DATA POINT ADDED HERE
          ].map(({ label, value }) => (
            <div key={label} style={{ background: T.panel, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", marginBottom: 4 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}