//TODO use client collection for SpotifySongs!!!!!!!!!!!!!!!!!


//users = new Mongo.Collection("users");

if (Meteor.isClient) {
SpotifySongs = new Mongo.Collection(null)

var makeSpotifyPlaylistRequest=function(url, userAccessToken, spotifyUsername, callback){
  HTTP.get(url, {
    headers:{
      Authorization: "Bearer "+userAccessToken
    }
  }, function(error, result){
    if(error){
      console.log("error", error);
    }
    if(result){
      callback(result)
    }
  });

}

var makeSpotifyPlaylistTracksRequest= function(url, userAccessToken, callback){
  HTTP.get(url,{
    headers:{
      Authorization: "Bearer "+userAccessToken
    }
  }, function(error,result){
    if(error){
      //console.log("error", error);
      //console.log("========================")
      if(error.response.statusCode==429){
        result = setTimeout(function(){

          HTTP.get(url,{
            headers:{
              Authorization: "Bearer "+userAccessToken
            }
          },function(error, result){
            if(error){
              //console.log("error", error);
            }
            if(result){
               return result
            }
          });


        }, 1000);
      }



    }if(result){
      callback(result)
    }
  });
}


var getSongFromSpotifyPlaylist= function(idx, laylistName, url, callback){
  var userAccessToken;
  var spotifyUsername;
  Meteor.call("retrieveSpotifyToken", currentSpotifyUserId(), function(error, result){
    if(error){
      console.log("error", error);
    }
    if(result){
       //console.log(result)
       userAccessToken = result.services.spotify.accessToken;
       spotifyUsername = result.services.spotify.id
       //console.log(userAccessToken);


       url = url+"?offset=0&limit=100"

       var allTrackFromCurrentPlaylist=[];
       var playlistTrackCallback = function(result){
         var temparray = Object.keys(result.data.items).map(function(key){return result.data.items[key]});
         allTrackFromCurrentPlaylist=allTrackFromCurrentPlaylist.concat(temparray);
         if(result.data.next!=null){
           makeSpotifyPlaylistTracksRequest(url, userAccessToken, playlistTrackCallback)
         }else{
           return callback(idx, allTrackFromCurrentPlaylist);
         }
       }
       makeSpotifyPlaylistTracksRequest(url, userAccessToken, playlistTrackCallback)




     }
   });
}

var getSpotifyPlaylists=function(callback){
  //console.log("HERENOW")
  //console.log(currentSpotifyUserId())

  //https://api.spotify.com/v1/users/{user_id}/playlists
  //var tempuser =

  //console.log(Meteor.email())
  var userAccessToken;
  var spotifyUsername;
  Meteor.call("retrieveSpotifyToken", currentSpotifyUserId(), function(error, result){
    if(error){
      console.log("error", error);
    }
    if(result){
       //console.log(result)
       userAccessToken = result.services.spotify.accessToken;
       spotifyUsername = result.services.spotify.id
       //console.log(userAccessToken);

       var playListRequestUrl = "https://api.spotify.com/v1/users/"+spotifyUsername+"/playlists?offset=0&limit=50"
       //var result;
       //var allSpotifyPlaylists= new Object();//array of all
       var allSpotifyPlaylists= [];

       //TODO implement while so there is no limit

       var  playlistRequestCallback = function(result){
         var temparray = Object.keys(result.data.items).map(function(key){return result.data.items[key]});
         //allSpotifyPlaylists.push(temparray);
         allSpotifyPlaylists=allSpotifyPlaylists.concat(temparray);
         if (result.data.next != null){
           makeSpotifyPlaylistRequest(result.data.next, userAccessToken, spotifyUsername, playlistRequestCallback)
         }else{
           return callback(allSpotifyPlaylists);
         }

       }

      makeSpotifyPlaylistRequest(playListRequestUrl, userAccessToken,spotifyUsername, playlistRequestCallback);



    }
  });

};

var currentSpotifyUserId = function(){
  return localStorage.getItem("currentSpotifyUserId")
};

  Template.SpotifyArea.helpers({
    create: function(){
      Session.set("SpotifyLoggedin", false);

    },
    rendered: function(){

    },
    destroyed: function(){

    },
    spotifyisLoggedin: function(){
      return Session.get("SpotifyLoggedin");
    },
    currentSpotifyUserId: currentSpotifyUserId,
    SpotifyPlaylistObtained: function(){
      return Session.get("SpotifyPlaylistObtained");
    },
    SpotifyPlaylists: function(){
      return Session.get("SpotifyPlaylists")
    },
    SpotifySongs: function(){
      return SpotifySongs.find({});
      //return Session.get("SpotifySongs")
    }
    // ,
    // currentSpotifyUserId: function(){
    //   return Session.get("currentSpotifyUserId")
    // },currentSpotifyLoginToken: function(){
    //   return Session.get("currentSpotifyLoginToken")
    // }


  });



  Template.SpotifyArea.events({

    'click #SpotifyLogInButton': function () {
      var options = {
        showDialog: true, // Whether or not to force the user to approve the app again if they’ve already done so.
        requestPermissions: ['playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private'] // Spotify access scopes.
      };
      Meteor.loginWithSpotify(options, function(err) {
        //console.log(Meteor.userId, OAuth.token);


        var currentSpotifyUserId1 =localStorage.getItem("Meteor.userId");
        var currentSpotifyLoginToken1 = localStorage.getItem("Meteor.loginToken")
        //console.log(currentSpotifyUserId);

        Session.set("SpotifyLoggedin", true);
        //Session.set("currentSpotifyUserId", currentSpotifyUserId1);
        //Session.set("currentSpotifyLoginToken", currentSpotifyLoginToken1);

        //console.log(currentSpotifyUserId1);
        localStorage.setItem("currentSpotifyUserId", currentSpotifyUserId1);
        localStorage.setItem("currentSpotifyLoginToken", currentSpotifyLoginToken1);

        //TODO implement getSpotifyPlaylists


      });
    },
    // 'click #refresh': function(){
    //
    // },
    'click #SpotifyGetPlaylistButton': function(){
      //console.log("clicked");
      //SpotifySongs.remove({})
      getSpotifyPlaylists(function(result){
        //console.log(result);
        //switch on the playlist results
        Session.set("SpotifyPlaylistObtained",true);
        Session.set("SpotifyPlaylists", result);

        //var SpotifySongs =[];
        for(i=0; i<result.length; i++){
          var currentid = SpotifySongs.insert({index: i, name: result[i].name, total: result[i].tracks.total, url: result[i].tracks.href});//SpotifySongs[i]= new Object();
          //SpotifySongs[result[0].name]={"total":result[0].tracks.total};
          //SpotifySongs[i].name= result[i].name
          //SpotifySongs[i].total=result[i].tracks.total;
          //SpotifySongs[i].url=result[i].tracks.href;
          //SpotifySongs[i].length=i;

          var current = SpotifySongs.findOne(currentid);
          //getSongFromSpotifyPlaylist(i, SpotifySongs[i].name, SpotifySongs[i].url, function(idx, result){
          getSongFromSpotifyPlaylist(currentid, current.name, current.url, function(idx, result){
            //console.log(result)
            SpotifySongs.update(idx, {$set:{tracks:result}});//SpotifySongs[idx].tracks=result;
            if(idx==result.length-1){
              //console.log(SpotifySongs)
              //Session.set("SpotifySongs", SpotifySongs);
            }
          });

        }

        //getSongFromSpotifyPlaylist= function(playlistName, url, callback){

        // for(j=0; j<SpotifySongs.length; j++){
        //   //getSongFromSpotifyPlaylist= function(playlistName, url, callback){
        //   getSongFromSpotifyPlaylist(SpotifySongs[i].name, SpotifySongs[i].url, function(result){
        //     //console.log(result)
        //     SpotifySongs[i].tracks=result;
        //   })
        //   if(i==SpotifySongs.length-1){
        //     Session.set("SpotifyPlaylists", SpotifySongs);
        //     console.log(SpotifySongs);
        //   }
        // }
        //Get Track Playlists
        });
        }
  });//end?
}

if (Meteor.isServer) {

   Meteor.startup(function () {

     Meteor.methods({
       retrieveSpotifyToken: function(userid){
         var tempuser = Meteor.users.findOne({_id:userid},{'services.spotify.loginTokens':{$slice:-1}})
         console.log(tempuser)
         return tempuser;
       }
     });
   });
}
