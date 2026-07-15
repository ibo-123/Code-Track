import {
  Card,
  CardContent
} from "../ui/card";


const progress = [
  {
    name: "Two Pointer",
    value: 80
  },
  {
    name: "Sliding Window",
    value: 65
  },
  {
    name: "Dynamic Programming",
    value: 40
  }
];


function ProgressCard() {

  return (

    <Card>

      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          DSA Progress
        </h2>


        <div className="space-y-5">

          {
            progress.map((item) => (

              <div key={item.name}>

                <div className="flex justify-between mb-2">

                  <span className="font-medium">
                    {item.name}
                  </span>

                  <span className="text-slate-500">
                    {item.value}%
                  </span>

                </div>


                <div
                  className="
                    h-3
                    bg-slate-200
                    rounded-full
                    overflow-hidden
                  "
                >

                  <div
                    className="
                      h-full
                      bg-blue-600
                      rounded-full
                      transition-all
                    "
                    style={{
                      width: `${item.value}%`
                    }}
                  />

                </div>


              </div>

            ))
          }


        </div>

      </CardContent>

    </Card>

  );
}


export default ProgressCard;