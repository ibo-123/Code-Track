import {
  Code2,
  Trophy,
  TrendingUp
} from "lucide-react";


const activities = [
  {
    icon: Code2,
    title:"Solved Two Pointer problem",
    time:"2 hours ago"
  },
  {
    icon:Trophy,
    title:"Participated in Codeforces Round",
    time:"Yesterday"
  },
  {
    icon:TrendingUp,
    title:"Rating increased +45",
    time:"3 days ago"
  }
];


function RecentActivity(){

  return (

    <div className="
      bg-white
      border
      rounded-xl
      p-6
      shadow-sm
    ">

      <h2 className="
        text-xl
        font-bold
        mb-6
      ">
        Recent Activity
      </h2>


      <div className="space-y-5">

      {
        activities.map((item,index)=>{

          const Icon=item.icon;


          return (

            <div
              key={index}
              className="
              flex
              items-center
              gap-4
              "
            >

              <div className="
                bg-blue-100
                text-blue-600
                p-3
                rounded-lg
              ">
                <Icon size={20}/>
              </div>


              <div>

                <p className="font-medium">
                  {item.title}
                </p>

                <p className="text-sm text-slate-500">
                  {item.time}
                </p>

              </div>


            </div>

          )

        })
      }

      </div>


    </div>

  )

}


export default RecentActivity;