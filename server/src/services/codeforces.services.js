import axios from "axios";


const BASE_URL =
"https://codeforces.com/api";

const validateHandle = (handle) => {
  if (!handle || typeof handle !== "string" || handle.trim() === "") {
    throw new Error("Codeforces handle is required");
  }

  return handle.trim();
};


// Get user profile

export const getCodeforcesUser =
async(handle)=>{


  try{
    handle = validateHandle(handle);
    const response =
    await axios.get(

      `${BASE_URL}/user.info?handles=${handle}`

    );
    


    if(response.data.status !== "OK"){
     return null;
      throw new Error(
        "Codeforces handle not found"
      );

    }



    return response.data.result[0];



  }catch(error){


    if(error.response?.status === 400){

      throw new Error(
        "Codeforces handle not found"
      );

    }

    throw new Error(
      "Unable to connect to Codeforces"
    );

  }

};









// Get rating history

export const getRatingHistory = async (handle) => {
  try {
    // Validate first
    handle = validateHandle(handle);

    const response = await axios.get(
      `${BASE_URL}/user.rating?handle=${handle}`
    );

    if (response.data.status !== "OK") {
      throw new Error("Unable to fetch rating history");
    }

    return response.data.result;

  } catch (error) {
    throw new Error("Unable to fetch rating history");
  }
};









// Get submissions

export const getSubmissions =
async(handle)=>{


  try{


    handle = validateHandle(handle);
    const response =
    await axios.get(

      `${BASE_URL}/user.status?handle=${handle}`

    );

    if(response.data.status !== "OK"){

      throw new Error(
        "Unable to fetch submissions"
      );

    }


    return response.data.result;



  }catch(error){


    throw new Error(
      "Unable to fetch submissions"
    );

  }

};









// Dashboard statistics

export const getCodeforcesStats =
async(handle)=>{

handle = validateHandle(handle);
  const [

    user,

    ratingHistory,

    submissions

  ] = await Promise.all([


    getCodeforcesUser(handle),


    getRatingHistory(handle),


    getSubmissions(handle),


  ]);





  const solvedProblems =
  new Set();



  submissions.forEach(
    submission=>{


      if(
        submission.verdict === "OK"
      ){


        solvedProblems.add(

          `${submission.problem.contestId}-${submission.problem.index}`

        );


      }


    }

  );





  return {


    handle:user.handle,


    rating:user.rating,


    maxRating:user.maxRating,


    rank:user.rank,


    maxRank:user.maxRank,


    contribution:user.contribution,


    avatar:user.avatar,



    problemsSolved:
    solvedProblems.size,



    contestCount:
    ratingHistory.length,



    ratingHistory,

  };


};