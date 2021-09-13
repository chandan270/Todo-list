require('dotenv').config();
const express=require("express");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const app=express();

const URI = process.env.URI;
mongoose.connect(URI,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
app.set('view engine','ejs');

var id=0;
var array=[];

const workSchema=new mongoose.Schema({
    work:String,
    deadline:String
});

const Work=mongoose.model("Work",workSchema);

const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    tasks:[workSchema]
});

userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.use(session({

    secret:"thisismysecret.",
    resave:false,
    saveUninitialized:false

}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){

    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                
                res.redirect("/");
            });
        }
    });

});

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){

    const user=new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err)
        console.log(err);
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/");
            });
        }
    });

});

app.get("/",function(req,res){
    if(req.isAuthenticated())
    {
        
        User.findById(req.user.id,function(err,foundUser){
            if(err)
            console.log(err);
            else
            {
                if(foundUser)
                {
                    // console.log(foundUser.tasks);
            
                res.render("todo",{info:foundUser.tasks});
                }
                else
                res.render("todo",{info:array});
            }
    
        })
   
    }
    else
    {
        res.redirect("/login");
    }
    

});

app.post("/",function(req,res){
    const info=new Work({
    work:req.body.work,
    deadline:req.body.deadline
    });
    // info.save();
    User.findById(req.user.id,function(err,foundUser){
        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                foundUser.tasks.push(info);
                foundUser.save(function(){
                    res.redirect("/");
                });
            }
        }

    })
    
});

app.post("/taskDelete",function(req,res){
   
    User.findById(req.user.id,function(err,foundUser){
        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                foundUser.tasks.pull(req.body.delete)
                foundUser.save(function(){
                    res.redirect("/");
                });
            }
        }

    })
    
});

app.get("/logout",function(req,res){

    req.logout();
    res.redirect("/login");

});

const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, function() {
    console.log("Server started.......");
});
