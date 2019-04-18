package com.example.ComicToon.Controllers;

import com.example.ComicToon.Models.*;
import com.example.ComicToon.Models.ModelRepositories.*;
import com.example.ComicToon.Models.RequestResponseModels.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;

@RestController
public class ComicController{
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ComicRepository comicRepository;
    @Autowired
    private ComicSeriesRepository ComicSeriesRepository;
    @Autowired
    private PanelRepository panelRepository;
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private RatingRepository ratingRepository;


    //Create Comic Series
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/create/series", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public CreateComicSeriesResult createComicSeries(@RequestBody CreateComicSeriesForm form){
        CreateComicSeriesResult result = new CreateComicSeriesResult();
        UserModel user = userRepository.findByusername(form.getUsername());
        System.out.println(user);
        if (user == null){
            result.setResult("user does not exists");
            return result;
        } else{
            //create and save new series
            ComicSeriesModel newComicSeries = new ComicSeriesModel(form.getName(), form.getDescription(), user.getId(), form.getPrivacy(), form.getGenre());
            ComicSeriesRepository.save(newComicSeries);
            //add comicseries id -> user
            user.getComicSeries().add(newComicSeries.getId());
            userRepository.save(user);
            result.setResult("success");
        }
        return result;
    }

    //Delete Comic Series (and of course every comic in the series)
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/delete/series", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public DeleteComicSeriesResult deleteComicSeries(@RequestBody DeleteComicSeriesForm form){
        DeleteComicSeriesResult result = new DeleteComicSeriesResult();

        ArrayList<ComicSeriesModel> candidates = ComicSeriesRepository.findByname(form.getSeriesName());
        UserModel owner = userRepository.findByusername(form.getOwnerName());
        if(candidates == null || owner == null){
            result.setResult("failure");
            return result;
        } else{
            for(ComicSeriesModel candidate: candidates){
                System.out.println("in first loop..");
                System.out.println(candidate);
                System.out.println(owner);
                if(candidate.getUserID().equals(owner.getId())){
                    ComicSeriesModel toDelete = candidate;
                    for(String c: toDelete.getComics()){
                        System.out.println("in second loop..");
                        System.out.println(c);
                        ArrayList<ComicModel> candidates2 = new ArrayList<>();
                        candidates2.add(comicRepository.findByid(c));
                        System.out.println("before 3rd loop..");
                        System.out.println(candidates2);
                        for(ComicModel d : candidates2){
                            if(d.getUserID().equals(owner.getId())){
                                comicRepository.delete(d);
                                break;
                            }

                        }
                    }
                    ComicSeriesRepository.delete(toDelete);
                    break;
                }
            }
            result.setResult("Deleted series & all enclosed comics");
        }
        return result;
    }

    //View Comic Series (not my series thats different)
        //show all comics (links?) in series

    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/view/comic-series", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public ViewComicSeriesResult viewComicSeries(@RequestBody ViewComicSeriesForm form){
        ViewComicSeriesResult result = new ViewComicSeriesResult();
        result.setComics(new ArrayList<ComicModel>());

        ArrayList <ComicSeriesModel> candidates = ComicSeriesRepository.findByname(form.getComicSeriesName());
        if (candidates.size() == 0) {
            result.setResult("failure");
            return result;
        }
        UserModel owner = userRepository.findByusername(form.getOwnerName());
        System.out.println("VIEWING SERIES");
        System.out.println(form.getOwnerName());
        System.out.println(form.getViewerName());
        System.out.println(owner.getId());
        System.out.println(candidates.size());
        for (ComicSeriesModel candidate: candidates){
            System.out.println(candidate.getUserID());
            if(candidate.getUserID().equals(owner.getId())){
                // Check permission
                ArrayList<String> shared = candidate.getSharedWith();
                if (!form.getOwnerName().equals(form.getViewerName()) && !shared.contains(form.getViewerName())) {
                    result.setResult("failure");
                    return result;
                }
                for(String comicID : candidate.getComics()){
                    ComicModel comic = comicRepository.findByid(comicID);
                    if (comic != null) {
                        result.getComics().add(comic);
                    }
                }
                break;
            }
        }
        result.setResult("success");
        return result;
    }


    //Create Comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/create/comic", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public CreateComicResult createComic(@RequestBody CreateComicForm form){
        CreateComicResult result = new CreateComicResult();

        UserModel user = userRepository.findByusername(form.getUsername());
        if (user == null){
            result.setResult("user does not exists");
            return result;
        } else{
            ArrayList<ComicSeriesModel> seriesList = ComicSeriesRepository.findByname(form.getSeries());
            ComicSeriesModel series = null;
            for(ComicSeriesModel s : seriesList){
                if(s.getUserID().equals(user.getId()))
                    series = s;
            }
            if(series!=null){
                System.out.println(form.getUsername());
                //create and save new comic
                Date date = new Date();
                String strDate = date.toString();
                ComicModel newComic = new ComicModel(form.getName(),form.getDescription(),user.getId(),form.getUsername(),series.getId(),strDate, form.getSharedWith(), form.getPrivacy(), true);
                // Create Panels for each and set references in comic
                ArrayList<String> canvasList = form.getCanvases();
                ArrayList<String> imageList = form.getImages();
                ArrayList<String> panelRefs = new ArrayList<>();
                for (int i = 0; i < canvasList.size(); i++) {
                    PanelModel newPanel = new PanelModel(imageList.get(i), canvasList.get(i), newComic.getId());
                    panelRepository.save(newPanel);
                    panelRefs.add(newPanel.getId());
                }
                newComic.setPanelsList(panelRefs);
                comicRepository.save(newComic);

                //now add comic reference to user
                user.getComics().add(newComic.getId());
                userRepository.save(user);

                //now add comic reference to comic series
                series.getComics().add(newComic.getId());
                ComicSeriesRepository.save(series);
                result.setResult("success");
            } else{
                result.setResult("comic series does not exists");
                return result;
            }
        }
        return result;
    }

    //Delete Comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/delete/comic", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public DeleteComicResult deleteComic(@RequestBody DeleteComicForm form){
        DeleteComicResult result = new DeleteComicResult();
        ArrayList<ComicModel> findComicList = comicRepository.findByname(form.getComicName());
        UserModel findUser = userRepository.findByusername(form.getOwnerName());
        if(findComicList.isEmpty() || findUser == null){
            result.setResult("failed");
        } else{
            for(ComicModel r : findComicList){
                if(r.getUserID().equals(findUser.getId())){
                    ComicSeriesModel series = ComicSeriesRepository.findByid(r.getComicSeriesID());
                    series.getComics().remove(r.getId());
                    ComicSeriesRepository.save(series);
                    comicRepository.delete(r);
                    result.setResult("Deleted Comic and reference in its series");

                }
            }
        }
        return result;
    }

    //Upload Comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/upload", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public UploadComicResult uploadComic(@RequestBody UploadComicForm form) {
        UploadComicResult result = new UploadComicResult();
        System.out.println(form.getUsername());
        System.out.println(form.getDescription());
        System.out.println(form.getName());
        System.out.println(form.getSeries());
        //System.out.println(form.getCanvas());
        //System.out.println(form.getImage());
        System.out.println(form.getSharedWith().size());
        UserModel user = userRepository.findByusername(form.getUsername());
        if (user == null){
            result.setResult("user does not exists");
            return result;
        } else{
            ArrayList<ComicSeriesModel> seriesList = ComicSeriesRepository.findByname(form.getSeries());
            ComicSeriesModel series = null;
            for(ComicSeriesModel s : seriesList){
                if(s.getUserID().equals(user.getId()))
                    series = s;
            }
            if(series!=null){
                System.out.println(form.getUsername());
                //create and save new comic
                Date date = new Date();
                String strDate = date.toString();
                String canvas = form.getCanvas();
                String image = form.getImage();
                boolean editable = canvas != "" ? true : false;
                ComicModel newComic = new ComicModel(form.getName(),form.getDescription(),user.getId(),form.getUsername(),series.getId(),strDate, form.getSharedWith(), form.getPrivacy(), editable);
                // Create the panel or json
                PanelModel newPanel = new PanelModel(image, canvas, newComic.getId());
                panelRepository.save(newPanel);
                ArrayList<String> singlePanel = new ArrayList<>();
                singlePanel.add(newPanel.getId());
                newComic.setPanelsList(singlePanel);
                comicRepository.save(newComic);

                //now add comic reference to user
                user.getComics().add(newComic.getId());
                userRepository.save(user);

                //now add comic reference to comic series
                series.getComics().add(newComic.getId());
                ComicSeriesRepository.save(series);
                result.setResult("success");
            } else{
                result.setResult("comic series does not exists");
                return result;
            }
        }
        return result;
    }

    //Update Series
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/update/series", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public UpdateSeriesResult updateSeries(@RequestBody UpdateSeriesForm form){
        UpdateSeriesResult result = new UpdateSeriesResult();

        ComicSeriesModel series = ComicSeriesRepository.findByid(form.getSeriesID());
        System.out.println("UPDATING SERIES");
        System.out.println(form.getSeriesID());
        System.out.println(form.getNew_Name());
        System.out.println(form.getNew_Description());
        System.out.println(form.getNew_Privacy());
        if(series!=null){
            series.setName(form.getNew_Name());
            series.setDescription(form.getNew_Description());
            series.setPrivacy(form.getNew_Privacy());
            series.setGenre(form.getNew_Genres());
            series.setSharedWith(form.getNew_SharedWith());
            ComicSeriesRepository.save(series);
            result.setResult("success");
        }

        return result;
    }

    //Update comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/update/comic", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public CreateComicResult updateComic(@RequestBody UpdateComicForm form){
        CreateComicResult result = new CreateComicResult();
        System.out.println("UPDATING COMIC");
        UserModel theUser = userRepository.findByusername(form.getUsername());
        ArrayList<ComicModel> the_model = comicRepository.findByUserID(theUser.getId());
        System.out.println("there are # of comics under the user:" + the_model.size());
        for(ComicModel comic : the_model){
            if(comic.getName().equals(form.getOldName())){//found right one
                System.out.println("FOUND THE RIGHT ONE");
                if(form.getDescription() != null)
                    comic.setDescription(form.getDescription());
                comic.setName(form.getName());
                // Find the old series and remove the reference
                ComicSeriesModel oldSeries = ComicSeriesRepository.findByid(comic.getComicSeriesID());
                if (oldSeries.getName() != form.getSeries()) {
                    ArrayList<String> oldSeriesComics = oldSeries.getComics();
                    oldSeriesComics.remove(comic.getId());
                    // oldSeries.setComics(oldSeriesComics);
                    ComicSeriesRepository.save(oldSeries);
                    // Replace the comic series reference in the comic
                    ArrayList<ComicSeriesModel> temp = ComicSeriesRepository.findByname(form.getSeries());
                    for (ComicSeriesModel t : temp) {
                        if (t.getUserID().equals(theUser.getId())) {
                            comic.setComicSeriesID(t.getId());
                            ArrayList<String> newSeriesComics = t.getComics();
                            newSeriesComics.add(comic.getId());
                            ComicSeriesRepository.save(t);
                            break;
                        }
                    }
                }
                // Delete the old panels and create new ones
                ArrayList<String> canvases = form.getCanvases();
                ArrayList<String> images = form.getImages();
                ArrayList<String> panelRefs = new ArrayList<>();
                for (String panelID : comic.getPanelsList()) {
                    panelRepository.deleteByid(panelID);
                }
                for (int i = 0; i < canvases.size(); i++) {
                    PanelModel newPanel = new PanelModel(images.get(i), canvases.get(i), comic.getId());
                    panelRepository.save(newPanel);
                    panelRefs.add(newPanel.getId());
                }
                comic.setPanelsList(panelRefs);

                comic.setSharedWith(form.getSharedWith());
                comic.setDate(new Date().toString());
                comic.setPrivacy(form.getPrivacy());

                comicRepository.save(comic);
                result.setResult("success");
                break;
            } 
        }
        return result;
    }


    //View Comic 
    //TODO SUGGESTION
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/view/comic", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public ViewComicResult viewComic(@RequestBody ViewComicForm form){
        ViewComicResult result = new ViewComicResult();
        System.out.println("VIEW COMIC");
        ArrayList<ComicModel> findComicList = comicRepository.findByname(form.getComicName());
        ComicModel findComic = null;
        for(ComicModel c: findComicList){
            System.out.println(c.getUsername());
            System.out.println(form.getComicOwnerName());
            if(c.getUsername().equals(form.getComicOwnerName()))
                findComic = c;
        }
        System.out.println(findComic);
        
        if(findComic!=null){
            ComicSeriesModel series = ComicSeriesRepository.findByid(findComic.getComicSeriesID());
            ArrayList<CommentModel> comments = new ArrayList<CommentModel>();
            ArrayList<RatingModel> ratings = new ArrayList<RatingModel>();
            ArrayList<PanelModel> panels = new ArrayList<PanelModel>();

            result.setComicName(findComic.getName());
            result.setDescription(findComic.getDescription());
            result.setCreatorName(form.getComicOwnerName());
            result.setSeriesName(series.getName());
            result.setPrivacy(findComic.getPrivacy());
            result.setSharedWith(findComic.getSharedWith());
            for(String c: findComic.getCommentsList()){
                CommentModel findComment = commentRepository.findByid(c);
                if(findComment!=null){
                    comments.add(findComment);
                }
            }
            result.setCommentsList(comments);

            for(String r: findComic.getRatingsID()){
                RatingModel rating = ratingRepository.findByid(r);
                if(rating!=null){
                    ratings.add(rating);
                }
            }

            result.setRatingsID(ratings);

            for(String p: findComic.getPanelsList()){
                PanelModel panel = panelRepository.findByid(p);
                if(panel !=null){
                    panels.add(panel);
                }
            }
            result.setPanels(panels);
            result.setSuggestions(null);
        }
        return result;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/view/allComics", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public BundleViewAllComics viewAllComics(@RequestBody ViewAllComicsForm form){
        BundleViewAllComics result = new BundleViewAllComics();
        UserModel theUser = userRepository.findByusername(form.getComicOwnerName());
        List<ComicModel> findComicList = comicRepository.findByUserID(theUser.getId());
        if(findComicList != null){
            for(int i=0; i<findComicList.size(); i++){
                ComicModel temp = findComicList.get(i);
                ViewAllComicsResult pans = new ViewAllComicsResult();
                pans.setComicName(temp.getName());
                pans.setComicID(temp.getId());
                for(int j=0; j<temp.getPanelsList().size(); j++){
                    PanelModel real = panelRepository.findByid(temp.getPanelsList().get(j));
                    pans.getComicList().add(real);
                }
                result.getBundleComicList().add(pans);
            }
        }
        return result;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/search", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public SearchResult search(@RequestBody SearchForm form){
        SearchResult result = new SearchResult();

        //search all 3 to see if any match
        UserModel user = userRepository.findByusername(form.getQuery());
        ArrayList<ComicModel> comics = comicRepository.findByname(form.getQuery());
        ArrayList<ComicSeriesModel> all_series = ComicSeriesRepository.findByname(form.getQuery());
        if(user != null)
            result.setUser(user); 
        if(comics != null)
            result.setAll_comics(comics);
        if(all_series != null)
            result.setAll_series(all_series);
        return result;
    }

    //The "my" use cases are bellow

    //View Own Comic Series
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/view/series", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public ViewMySeriesResult viewMySeries(@RequestBody ViewMySeriesForm form){
        ViewMySeriesResult result = new ViewMySeriesResult();
        UserModel user = userRepository.findByusername(form.getUsername());
        if(user == null){
            return result;
        } else{
            for (String seriesID : user.getComicSeries()){
                ComicSeriesModel series = ComicSeriesRepository.findByid(seriesID);
                result.getComicSeries().add(series);
            }
        }
        return result;
    }

    //Subscribe to series
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/subscribe", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public SubscriptionResult subscribe(@RequestBody SubscriptionForm form){
        SubscriptionResult result = new SubscriptionResult();

        UserModel user = userRepository.findByusername(form.getUsername());
        if(user == null) {
            return result;
        } else {
            user.getSubscriptions().add(form.getUsername());
            result.setResult("success");
        }
        return result;
    }

    //View Subscriptions (list of subscriptions of a user -> not same as the subscriptions section of homepage)
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/subscriptions", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public ViewSubscriptionsResult viewSubscriptions(@RequestBody ViewSubscriptionsForm form){
        ViewSubscriptionsResult result = new ViewSubscriptionsResult();
        UserModel user = userRepository.findByusername(form.getUsername());
        if(user==null){
            return result;
        }
        for(String subscriptionsid : user.getSubscriptions()){
            result.getSeries().add(ComicSeriesRepository.findByid(subscriptionsid));
        }
        return result;
    }

    // View Recent Creations
    // @CrossOrigin(origins = "http://localhost:3000")
    // @RequestMapping(value = "/welcomerecent", method = RequestMethod.POST, consumes = {"application/json"})
    // @ResponseBody
    // public RecentCreationsResult recent(@RequestBody ViewAllComicsForm form){
    //     List<ComicModel> comics = comicRepository.findAll();
    //     RecentCreationsResult result = new RecentCreationsResult();

    //     for(ComicModel comic : comics) {
    //         result.getComics().add(comicRepository.findByid(comic.getId()));
    //     }
    //     return result;
    // }
    
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/welcomerecent", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public BundleViewAllComics recent(@RequestBody ViewAllComicsForm form){
        BundleViewAllComics result = new BundleViewAllComics();
        List<ComicModel> findComicList = comicRepository.findAll();
        if(findComicList != null){
            for(int i=0; i<findComicList.size(); i++){
                ComicModel temp = findComicList.get(i);
                ViewAllComicsResult pans = new ViewAllComicsResult();
                pans.setComicName(temp.getName());
                pans.setComicID(temp.getId());
                for(int j=0; j<temp.getPanelsList().size(); j++){
                    PanelModel real = panelRepository.findByid(temp.getPanelsList().get(j));
                    pans.getComicList().add(real);
                }
                result.getBundleComicList().add(pans);
            }
        }
        return result;
    }

    //Get a single panel
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/view/panel", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public ViewPanelResult viewPanel(@RequestBody ViewPanelForm form){
        System.out.println("GETTING A PANEL");
        ViewPanelResult result = new ViewPanelResult();
        System.out.println(form.getId());
        PanelModel panel = panelRepository.findByid(form.getId());
        if (panel != null) {
            result.setPanel(panel);
        }
        return result;
    }

    //Rate Comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/comic/rate", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public RateComicResult RateComic(@RequestBody RateComicForm form){
        RateComicResult result = new RateComicResult();
        ComicModel comic = comicRepository.findByid(form.getComicID());
        UserModel user = userRepository.findByusername(form.getUsername());
        if (comic != null && user != null) {
            
            RatingModel newRating = new RatingModel(user.getId(), form.getRating(), comic.getId());
            ratingRepository.save(newRating);
            result.setResult("success");

        }
        return result;
    }

    //Get aggregate ratings for A comic
    @CrossOrigin(origins = "http://localhost:3000")
    @RequestMapping(value = "/comic/rate/getRating", method = RequestMethod.POST, consumes = {"application/json"})
    @ResponseBody
    public GetRatingResult getRatingComic(@RequestBody GetRatingForm form){
        GetRatingResult result = new GetRatingResult();
        ComicModel comic = comicRepository.findByid(form.getComicID());
        if (comic != null) {
            
            ArrayList<String> ratingID = comic.getRatingsID();
            int totalRating = 0;
            for (String id: ratingID){
                RatingModel rating = ratingRepository.findByid(id);
                if(rating != null){
                    totalRating += rating.getRating();
                }
            }
        
            result.setResult(totalRating);

        }
        return result;
    }



    //Download Comic

    //Comment on Comic
}