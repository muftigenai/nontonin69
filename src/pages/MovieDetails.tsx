import { useParams } from 'react-router-dom';

const MovieDetails = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Detail Film</h1>
      <p>Detail untuk film dengan ID: {id}</p>
      <p>Halaman ini sedang dalam pengembangan.</p>
    </div>
  );
};

export default MovieDetails;