import {
  Star,
  Quote,
} from "lucide-react";

const testimonials = [
  {
    name: "Abel Tadesse",
    role: "Competitive Programmer",
    rating: 5,
    text:
      "CodeTrack helped me visualize my rating progress and identify weak areas. The dashboard is clean and incredibly useful.",
    avatar: "A",
  },
  {
    name: "Sara Mohammed",
    role: "Computer Science Student",
    rating: 5,
    text:
      "I love having my contest history, rating changes, and performance analytics in one place. It saves me a lot of time.",
    avatar: "S",
  },
  {
    name: "Daniel Bekele",
    role: "ICPC Participant",
    rating: 5,
    text:
      "The upcoming contests and rating charts keep me motivated. It's exactly the kind of tool I needed.",
    avatar: "D",
  },
];

function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto">

          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Testimonials
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4">
            Loved by Competitive Programmers
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Here's what early users say about CodeTrack.
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-20">

          {testimonials.map((user) => (

            <div
              key={user.name}
              className="
                bg-slate-50
                rounded-3xl
                p-8
                border
                hover:shadow-xl
                transition
              "
            >

              <Quote
                className="text-blue-600"
                size={34}
              />

              <p className="mt-6 text-slate-600 leading-8">
                "{user.text}"
              </p>

              <div className="flex mt-6">

                {Array.from({
                  length: user.rating,
                }).map((_, index) => (

                  <Star
                    key={index}
                    size={18}
                    className="
                      text-yellow-500
                      fill-yellow-500
                    "
                  />

                ))}

              </div>

              <div className="flex items-center gap-4 mt-8">

                <div
                  className="
                    w-14
                    h-14
                    rounded-full
                    bg-blue-600
                    text-white
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-xl
                  "
                >
                  {user.avatar}
                </div>

                <div>

                  <h4 className="font-bold">
                    {user.name}
                  </h4>

                  <p className="text-slate-500">
                    {user.role}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default Testimonials;