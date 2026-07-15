import {
  Card,
  CardContent
} from "../ui/card";


function StatCard({
  title,
  value,
  icon: Icon,
  description
}) {

  return (
    <Card className="hover:shadow-lg transition">

      <CardContent className="p-6">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-sm text-slate-500">
              {title}
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {value}
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              {description}
            </p>

          </div>


          <div
            className="
            bg-blue-100
            text-blue-600
            p-3
            rounded-xl
            "
          >
            <Icon size={28}/>
          </div>


        </div>

      </CardContent>

    </Card>
  );
}


export default StatCard;