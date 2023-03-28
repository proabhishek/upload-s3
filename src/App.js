import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import AWS from 'aws-sdk';

import './App.css';

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});

const s3 = new AWS.S3();
const bucketName = process.env.REACT_APP_S3_BUCKET;

function App() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileKey, setFileKey] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];

    if (!file.type.startsWith('video/mp4')) {
      alert('Please select an mp4 file.');
      return;
    }

    const params = {
      Bucket: bucketName,
      Key: `${Date.now()}-${file.name}`,
      Body: file,
      ContentType: file.type,
    };

    setUploading(true);

    s3.upload(params)
      .on('httpUploadProgress', (event) => {
        const progress = Math.round((event.loaded * 100) / event.total);
        setProgress(progress);
      })
      .send((err, data) => {
        if (err) {
          console.error(err);
          alert('Upload failed.');
          setUploading(false);
          return;
        }

        setUploaded(true);
        setFileKey(params.Key);
        setUploading(false);
      });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const reset = () => {
    setUploaded(false);
    setProgress(0);
    setFileKey('');
  };

  return (
    <div className="App">
      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} accept="video/mp4" />
        {uploaded ? (
          <div>
            <p>Video Uploaded Successfully</p>
            <video src={`https://${bucketName}.s3.amazonaws.com/${fileKey}`} controls width="320" height="240" />
            <button onClick={reset}>Upload another video</button>
          </div>
        ) : (
          <p>Drag and drop an mp4 file here, or click to browse.</p>
        )}
      </div>
      {uploading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}>{progress}%</div>
        </div>
      )}
    </div>
  );
}

export default App;
