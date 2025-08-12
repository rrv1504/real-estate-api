import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import { requireSignIn } from './middleware/authMiddleware.js';
import adRoutes from './routes/ad.js';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit'; 
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';




const app = express();
const swaggerDocument = YAML.load('./documentation/api-docs.yaml');


//midleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

const limiter = rateLimit({
  windowMs : 15*60*1000,//15 minutes
  max : 100,//limit each Ip to 100 requests per windowMs
  message : "Too many requests from this IP, please try again after 15 minutes",
})

app.use(limiter);

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    app.use('/api',authRoutes);
    app.use('/api',adRoutes);

    //global error handler middleware
    app.use((err,req,res,next) => {
      console.error(err.stack);
      return res.status(500).send("Something Went Wrong!!!");
    })
  
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  })
  .catch(err => console.error('MongoDB connection error:', err));



app.listen(8000, () => {
    console.log('Server is running on port 8000');
});



//routes
app.get('/api',(req,res) => {
    res.send(`The current time is ${new Date().toLocaleTimeString()}`);
});