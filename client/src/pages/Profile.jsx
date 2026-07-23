import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Code2,
  Trophy,
  Save,
} from "lucide-react";
import { connectCodeforces } from "../services/codeforcesService";
import { getProfile, updateProfile } from "../services/userService";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    codeforcesHandle: "",
    leetcodeUsername: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const handleConnectCodeforces = async () => {
  if (!form.codeforcesHandle) {
    alert("Enter a Codeforces handle first");
    return;
  }

  try {
    setConnecting(true);

    const response = await connectCodeforces(
      form.codeforcesHandle
    );

    alert(response.message);

    await loadProfile();

  } catch (error) {

    alert(
      error.response?.data?.message ||
      "Connection failed"
    );

  } finally {

    setConnecting(false);

  }
};
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        codeforcesHandle: data.user.codeforcesHandle || "",
        leetcodeUsername: data.user.leetcodeUsername || "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await updateProfile({
        name: form.name,
        codeforcesHandle: form.codeforcesHandle,
        leetcodeUsername: form.leetcodeUsername,
      });

      alert("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
      alert("Update Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <h2 className="text-xl font-semibold">Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}

      <div className="bg-white rounded-xl border shadow-sm p-8">

        <div className="flex flex-col md:flex-row items-center gap-6">

          <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-5xl font-bold">
            {form.name.charAt(0).toUpperCase()}
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              {form.name}
            </h1>

            <p className="text-slate-500 mt-1">
              Competitive Programmer
            </p>

            <p className="text-blue-600 mt-2">
              {form.email}
            </p>

          </div>

        </div>

      </div>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border shadow-sm p-8 space-y-6"
      >

        <h2 className="text-2xl font-bold">
          Personal Information
        </h2>

        {/* Name */}

        <div>

          <label className="font-medium mb-2 flex items-center gap-2">
            <User size={18}/>
            Name
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

        </div>

        {/* Email */}

        <div>

          <label className="font-medium mb-2 flex items-center gap-2">
            <Mail size={18}/>
            Email
          </label>

          <input
            className="w-full border rounded-lg p-3 bg-slate-100"
            value={form.email}
            readOnly
          />

        </div>

        {/* Codeforces */}

        <div>

          <label className="font-medium mb-2 flex items-center gap-2">
            <Code2 size={18}/>
            Codeforces Handle
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="codeforcesHandle"
            value={form.codeforcesHandle}
            onChange={handleChange}
            placeholder="tourist"
          />
          <button
  type="button"
  onClick={handleConnectCodeforces}
  disabled={connecting}
  className="
    mt-3
    bg-orange-500
    hover:bg-orange-600
    text-white
    px-4
    py-2
    rounded-lg
  "
>
  {
    connecting
      ? "Connecting..."
      : "Connect Codeforces"
  }
</button>

        </div>

        {/* LeetCode */}

        <div>

          <label className="font-medium mb-2 flex items-center gap-2">
            <Trophy size={18}/>
            LeetCode Username
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="leetcodeUsername"
            value={form.leetcodeUsername}
            onChange={handleChange}
            placeholder="leetcode_username"
          />

        </div>

        <button
          disabled={saving}
          className="
            flex
            items-center
            gap-2
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-6
            py-3
            rounded-lg
            transition
            disabled:opacity-60
          "
        >

          <Save size={18}/>

          {saving ? "Saving..." : "Save Changes"}

        </button>

      </form>

    </div>
  );
}

export default Profile;