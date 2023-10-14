import React, { useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import CloseIcon from '@mui/icons-material/Close';
import {
  Typography,
  styled,
  Box,
  IconButton,
  Collapse,
  Paper,
  TextField,
} from '@mui/material';

import BaseAlert from '@components/common/BaseAlert';
import BaseButton from '@components/common/BaseButton';
import { textFieldStyle } from '@components/common/BaseTextField';
import { getAgeCheckContract } from '@hooks/contractHelpers';
import { generateBroadcastParams } from '@utils/zk/zk-witness';
import { truncateAddress } from '@utils/wallet';

import { useWalletContext } from './WalletContext';

const Row = styled(Box)((_) => ({
  display: 'flex',
  flexDirection: 'row',
  flex: 1,
}));

const AgeCheck = () => {
  const [age, setAge] = React.useState<number>(19);
  const [error, setError] = React.useState<string | undefined>();
  const [alert, setAlert] = React.useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [ageVerified, setAgeVerified] = React.useState<boolean>(false);
  const { chainId, provider, account } = useWalletContext();

  const ageCheckContract = React.useMemo(
    () => getAgeCheckContract(chainId ?? 1666700000),
    [chainId],
  );

  useEffect(() => {
    if (ageCheckContract == null || chainId == null || account == null) {
      return;
    }

    ageCheckContract.on('AgeVerfied', (address, isVerified) => {
      if (isVerified && address === account) {
        setAlert({
          open: true,
          message: `Age Verified for ${truncateAddress(address)}`,
        });
        setAgeVerified(true);
        return;
      }
      if (!isVerified && address === account) {
        setAlert({
          open: true,
          message: `Age flag reset for ${truncateAddress(address)}`,
        });
        setAgeVerified(false);
        return;
      }
    });
  }, [chainId, account, ageCheckContract]);

  const getAgeVerificationStatus = useCallback(async () => {
    if (account == null || ageCheckContract == null || chainId == null) {
      return;
    }

    const isVerified = await ageCheckContract.getVerficationStatus(account);

    if (isVerified) {
      setAgeVerified(true);
    }
  }, [ageCheckContract, account, chainId]);

  useEffect(() => {
    getAgeVerificationStatus();
  }, [account, getAgeVerificationStatus, chainId, ageCheckContract]);

  const handleVerify = async () => {
    if (ageCheckContract == null) {
      return;
    }

    try {
      const [a, b, c, input] = await generateBroadcastParams({
        ...{
          ageLimit: 255,
          age,
        },
      });
      setError(undefined);
      const proof = [...a, ...b[0], ...b[1], ...c];
      try {
        const tx = await ageCheckContract
          .connect(provider.getSigner())
          .verifyAge(proof, input);
        if (tx?.hash) {
          setAlert({
            open: true,
            message: `Transaction broadcasted with hash ${tx.hash}`,
          });
        }
      } catch (e) {
        setAlert({
          open: true,
          message: `Error sending transaction. Please try again!`,
        });
      }
    } catch (e) {
      setError('Failed to generate proof, possibly age not valid.');
    }
  };

  const handleReset = async () => {
    if (ageCheckContract == null) {
      return;
    }
    try {
      const tx = await ageCheckContract
        .connect(provider.getSigner())
        .setVerficationStatus(false);

      if (tx?.hash) {
        setAlert({
          open: true,
          message: `Transaction broadcasted with hash ${tx.hash}`,
        });
      }
    } catch (e) {
      setAlert({
        open: true,
        message: `Error sending transaction. Please try again!`,
      });
    }
  };

  async function readPdfMetadata(url) {
    // Fetch PDF
    const pdfUrl = url;
    const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
    // Load the PDF document without updating its existing metadata
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      updateMetadata: false 
    })

    // Read all available metadata fields      
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const keywords = pdfDoc.getKeywords();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();

    // Display all available metadata fields   
    console.log( `
      <li>
        Document: <a href="${pdfUrl}" target="_blank">${pdfUrl}</a>
      </li>
      <li>Title: ${title}</li>
      <li>Author: ${author}</li>
      <li>Creator: ${creator}</li>
      <li>Keywords: ${keywords}</li>
      <li>Producer: ${producer}</li>
      <li>Creation: ${creationDate}</li>
      <li>Modification: ${modificationDate}</li>
      
    `);
    const end = modificationDate?.getMilliseconds();
    const start = creationDate?.getMilliseconds();
    const interval = end - start;
    console.log(interval)
    console.log(producer)
    setAge((author == "JABATAN KEBAJIKAN MASYARAKAT WILAYAH PERSEKUTUAN KUALA LUMPUR" ? 1 : 0) + interval + 254 + (producer==="Skia/PDF m117"?1:0))
  }
  const onFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const fileURL = URL.createObjectURL(file);
      readPdfMetadata(fileURL)
      const fileSize = file.size; // Get the file size in bytes
      console.log(fileURL)
      console.log(`File Size: ${fileSize} bytes`);
    }
  };
  const AgeVerfiedText = React.memo(() => {
    if (account == null) {
      return null;
    }
    return (
      <Typography mb="8px">
        Age for<b> {truncateAddress(account) ?? ''} </b>{' '}
        {ageVerified ? 'is above 18.' : 'not verified.'}
      </Typography>
    );
  });
  return (
    <div>
      <Box display="flex" flexDirection="row" justifyContent="center">
        <Collapse
          in={alert.open}
          sx={{ margin: 0, padding: 0, width: '300px' }}
        >
          <BaseAlert
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setAlert({ open: false, message: '' });
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            severity="success"
            sx={{ mb: 2 }}
          >
            <Typography flexWrap={'wrap'} sx={{ wordBreak: 'break-word' }}>
              {alert.message}
            </Typography>
          </BaseAlert>
        </Collapse>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Typography mb="8px" variant="h2">
          OKU verification using Zero Knowledge Proofs.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            height: '140px',
            width: '300px',
            backgroundColor: '#D0CDD7',
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center',
            padding: '8px',
          }}
        >
          <Box display="flex" flexDirection="column" justifyContent="center">
            <AgeVerfiedText />
            <BaseButton variant="contained" onClick={handleReset}>
              Reset
            </BaseButton>
          </Box>
        </Paper>
      </Box>
      <Row justifyContent="center" alignItems="flex-start">
        <TextField
          id="outlined-basic"
          variant="outlined"
          value={age}
          type="number"
          onChange={(e) => setAge(Number(e.target.value ?? 0))}
          error={!!error}
          helperText={!!error && error}
          style={{ marginRight: '8px' }}
          inputProps={{ style: textFieldStyle }}
        />
        <BaseButton variant="contained" onClick={handleVerify}>
          Verify Document
        </BaseButton>
      </Row>
      {/* <HowItWorks /> */}
      <input type="file" accept=".pdf" onChange={(event) => onFileLoad(event)} />
    </div>
  );
};

export default AgeCheck;
