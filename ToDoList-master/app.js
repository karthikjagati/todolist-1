const express=require("express");
const request=require("request");
const bodyParser=require("body-parser");
const lodash=require("lodash");
const app=express();

//for ejs template framework
app.set("view engine","ejs");   
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));





//for database connection
const mongoose=require("mongoose");
//hosting databse on mongodb atlas
mongoose.connect("mongodb+srv://admin-harshit:test123@cluster0.s7dfoub.mongodb.net/todolistDb");

const itemsSchema=new mongoose.Schema({   //schema for home route
    name:String
})


const Itemmodel=mongoose.model("Item",itemsSchema);

const doc1=new Itemmodel({
     name:"Welcome to your To-DoList"
})

const doc2=new Itemmodel({
    name:"Hit + to add new item"
})

const doc3=new Itemmodel({
    name:"<--Hit this to delete an item"
})

const defaultitems=[doc1,doc2,doc3]


const listSchema=new mongoose.Schema({    //schema for dynamic route
    name:String,
    items:[itemsSchema]
})
const listModel=new mongoose.model("List",listSchema);



//for server connection and response on get-post request

app.get("/",function(request1,response1)
{
    Itemmodel.find({},function(err,results)
    {
       if(err){
        console.log(err);
       }
       else if(results.length===0){
         Itemmodel.insertMany(defaultitems,function(err)
         {
            if(err){
                console.log(err);
            }
            else{
                console.log("Default items saved to database: Success");
            }
         })
         response1.redirect("/");   //on reaching home-page control goes to else-block below because now the retured results array is not empty 
       }
       else{
         response1.render("list", {listTitle: "Today",newListItem: results});
       }
    })
});

app.post("/",function(request1,response1)
{
    let itemName=request1.body.newItem;
    let listName=request1.body.newList;
    const itemDoc=new Itemmodel({        //mongodb document
          name:itemName
    });

    if(listName==="Today"){
        itemDoc.save();                      //saving item to the database
        response1.redirect("/");
    }
    else{
        listModel.findOne({name:listName},function(err,foundList)
        {
            foundList.items.push(itemDoc);
            foundList.save();
            response1.redirect("/"+listName);
        })
    }

});

//using route param for dynamic route
//getting response on dynamic route
app.get("/:coustomListName",function(req,res)   
{
    // console.log(request1.params.paramName); //prints paramName -> path targetted
    const coustomListName=lodash.capitalize(req.params.coustomListName);
    //using lodash to covert home or HOME or HomE etc  to Home
    
    //checking for already present list ,if not present then insert the list
    listModel.findOne({name:coustomListName},function(err,foundList)
    {
        if(!err){
            if(!foundList){
                //creating new list and inserting it
                const listDoc=new listModel({
                    name:coustomListName,
                    items:defaultitems      //itemmodel based array
                })
                listDoc.save();
                res.redirect("/"+coustomListName);
            }else{
                //foundList is already present//showing already present list
             res.render("list", {listTitle: foundList.name,newListItem: foundList.items});
            }
        }
    })
})

app.post("/delete",function(request1,response1)
{
    const checkedItemId=request1.body.checkbox1;   //_id
    const listName=request1.body.listName;  //hidden input type's value is returned
    
    if(listName==="Today"){

        Itemmodel.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("deletion success");
                response1.redirect("/");
            }
        });
    }
    else{
        //delete request is coming here from coustom list: dynamic path
        //pull: removes all instances from an array
        listModel.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}} , function(err,foundList)
        {
            if(!err){
                response1.redirect("/"+listName);
            }
        })
    }
});

app.listen(process.env.PORT || 3000,function()
{
    console.log("Server Started at Port: 3000");
})