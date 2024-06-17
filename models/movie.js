import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
    title: String,
    id: String,
    name: String,
});

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;