const express = require('express');
const app = express();
const port = 3005;
const mongoose = require('mongoose');
const _ = require('lodash')

app.set('view engine','ejs')
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

//create a new database in mongodb at the link where it is hosted
// avoid that deprecation warning
mongoose.connect("mongodb+srv://admin-tenzin:todo123$@cluster0.fsorq.mongodb.net/todosDB", {useNewUrlParser:true});

//create the schema - blueprint for the document in mongodb database
const todoSchema = {
  name : String,
  completed: Boolean,
};

//create a mongoose model based on the itemSchema - capitalized (singular version of the collections,itemSchema)
const Todo = mongoose.model('todo', todoSchema);

//create items in the collections
const readBooks = new Todo ({
  name:"read Books",
  completed: true,
});

const washClothes = new Todo ({
  name:"wash Clothes",
  completed: false,
});

const callMom = new Todo ({
  name: "call Mom",
  completed: true,
});

const defaultTodos = [readBooks,washClothes,callMom]

//another Schema
const listSchema = {
  name: String,
  items: [todoSchema]
};
//create a mongoose model based on the listSchema
const List = mongoose.model('list',listSchema);

//get the collections in app.js instead of hyper terminal

app.get('/',function(req,res){

  Todo.find({}, function(err,result){
    if (err){
      console.log(err);
    }else{
      if (result.length === 0){
        Todo.insertMany(defaultTodos, function(err){
          if (err){
            console.log(err)
          }else{
            console.log("successfully inserted")
          }
        });
        res.redirect("/");
      }else{
        res.render('todo',{listTitle:"Today", listItems:result})
        console.log("result",result)
      }
    }
  });
});

//adding tasks to the todolist and posting it
app.post('/',function(req,res){
  console.log(req.body.post)
  const name = req.body.task
  const listName = req.body.list

  //create a new item using mongodb
  const task = new Todo({
    name: name,
  });

  if (listName=="Today"){
    task.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,result){
      console.log(result.items.name);
      result.items.push(task);
      result.save();
      res.redirect("/" + listName);
    })
  }
});

app.post('/delete', function(req,res){
   const completedTaskId =  req.body.checkbox;
   const listName = req.body.listName;

   if (listName === "Today"){
     Todo.findByIdAndRemove(completedTaskId,function(err){
       if (err){
         console.log(err);
       }else{
         console.log("successfully deleted");
         res.redirect("/");
       }
     })
   }else{
     List.findOneAndUpdate({name:listName},{$pull:{items:{_id:completedTaskId}}},function(err,result){
       if (!errors){
         res.redirect("/"+listName)
       }
     })
   }

});

app.get('/:customRouteName',function(req,res){
  const customRouteName = _.capitalize(req.params.customRouteName);

  List.findOne({name:customRouteName},function(err,result){
    if (!err){
      if (!result){
        //create a new list
        const list = new List({
          name: customRouteName,
          items: defaultTodos,
        });
        list.save();
        res.redirect("/" + customRouteName);
      }else{
        res.render("todo",{listTitle: result.name, listItems: result.items});
        console.log("exist")
        console.log("result b", result.items)
    }
  };
});
});

app.get('/about',function(req,res){
  res.render('about')
});

//port that heroku has set up
let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
};

app.listen(port,function(){
  console.log("server is running on " + port)
})
