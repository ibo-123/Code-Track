import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is CodeTrack?",
    answer:
      "CodeTrack is a competitive programming dashboard that helps you monitor your Codeforces performance, rating history, contest participation, solved problems, and overall progress.",
  },
  {
    question: "How do I connect my Codeforces account?",
    answer:
      "After creating an account, go to your Profile or Settings page and enter your Codeforces handle. CodeTrack will automatically synchronize your public contest data.",
  },
  {
    question: "Is CodeTrack free to use?",
    answer:
      "Yes. The core features of CodeTrack are completely free, including dashboard analytics, contest tracking, and rating history.",
  },
  {
    question: "Does CodeTrack support LeetCode?",
    answer:
      "LeetCode integration is planned for a future release. The first version focuses on Codeforces analytics.",
  },
  {
    question: "How often is my data updated?",
    answer:
      "Whenever you refresh your dashboard or reconnect your account, CodeTrack fetches the latest public information from Codeforces.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. Passwords are securely stored and your Codeforces public data is only used to generate your analytics dashboard.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section
      id="faq"
      className="py-24 bg-slate-50"
    >
      <div className="max-w-4xl mx-auto px-6">

        <div className="text-center">

          <span className="text-blue-600 font-semibold uppercase tracking-widest">
            FAQ
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4">
            Frequently Asked Questions
          </h2>

          <p className="text-slate-600 mt-6 text-lg">
            Everything you need to know about CodeTrack.
          </p>

        </div>

        <div className="mt-16 space-y-5">

          {faqs.map((faq, index) => {

            const isOpen = openIndex === index;

            return (

              <div
                key={faq.question}
                className="
                  bg-white
                  rounded-2xl
                  border
                  shadow-sm
                  overflow-hidden
                "
              >

                <button
                  onClick={() => toggle(index)}
                  className="
                    w-full
                    flex
                    justify-between
                    items-center
                    p-6
                    text-left
                  "
                >

                  <h3 className="font-semibold text-lg">
                    {faq.question}
                  </h3>

                  {isOpen ? (
                    <Minus
                      className="text-blue-600"
                    />
                  ) : (
                    <Plus
                      className="text-slate-500"
                    />
                  )}

                </button>

                <div
                  className={`
                    transition-all
                    duration-300
                    overflow-hidden
                    ${
                      isOpen
                        ? "max-h-96"
                        : "max-h-0"
                    }
                  `}
                >

                  <p className="px-6 pb-6 text-slate-600 leading-8">
                    {faq.answer}
                  </p>

                </div>

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}

export default FAQ;