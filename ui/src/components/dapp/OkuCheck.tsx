import React, { useEffect, useCallback } from 'react';

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
import { getOkuCheckContract } from '@hooks/contractHelpers';
import { generateBroadcastParams } from '@utils/zk/zk-witness';
import { truncateAddress } from '@utils/wallet';

import { useWalletContext } from './WalletContext';

const Row = styled(Box)((_) => ({
  display: 'flex',
  flexDirection: 'row',
  flex: 1,
}));

const OkuCheck = () => {
  const [oku, setOku] = React.useState<number>(19);
  const [error, setError] = React.useState<string | undefined>();
  const [alert, setAlert] = React.useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [okuVerified, setOkuVerified] = React.useState<boolean>(false);
  const { chainId, provider, account } = useWalletContext();

  const okuCheckContract = React.useMemo(
    () => getOkuCheckContract(chainId ?? 1666700000),
    [chainId],
  );

  useEffect(() => {
    if (okuCheckContract == null || chainId == null || account == null) {
      return;
    }

    okuCheckContract.on('OkuVerfied', (address, isVerified) => {
      if (isVerified && address === account) {
        setAlert({
          open: true,
          message: `Oku Verified for ${truncateAddress(address)}`,
        });
        setOkuVerified(true);
        return;
      }
      if (!isVerified && address === account) {
        setAlert({
          open: true,
          message: `Oku flag reset for ${truncateAddress(address)}`,
        });
        setOkuVerified(false);
        return;
      }
    });
  }, [chainId, account, ageCheckContract]);

  const getOkuVerificationStatus = useCallback(async () => {
    if (account == null || okuCheckContract == null || chainId == null) {
      return;
    }

    const isVerified = await okuCheckContract.getVerficationStatus(account);

    if (isVerified) {
      setOkuVerified(true);
    }
  }, [okuCheckContract, account, chainId]);

  useEffect(() => {
    getOkuVerificationStatus();
  }, [account, getOkuVerificationStatus, chainId, okuCheckContract]);

  const handleVerify = async () => {
    if (okuCheckContract == null) {
      return;
    }

    try {
      const [a, b, c, input] = await generateBroadcastParams({
        ...{
          okuLimit: 255,
          oku,
        },
      });
      setError(undefined);
      const proof = [...a, ...b[0], ...b[1], ...c];
      try {
        const tx = await okuCheckContract
          .connect(provider.getSigner())
          .verifyOku(proof, input);
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
      setError('Failed to generate proof, possibly document not valid.');
    }
  };

  const handleReset = async () => {
    if (okuCheckContract == null) {
      return;
    }
    try {
      const tx = await okuCheckContract
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
  const OkuVerfiedText = React.memo(() => {
    if (account == null) {
      return null;
    }
    return (
      <Typography mb="8px">
         Oku for<b> {truncateAddress(account) ?? ''} </b>{' '}
        {okuVerified ? 'is verified' : 'not verified.'}
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
          Oku verification using Zero Knowledge Proofs.
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
            <OkuVerfiedText />
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
          value={oku}
          type="number"
          onChange={(e) => setOku(Number(e.target.value ?? 0))}
          error={!!error}
          helperText={!!error && error}
          style={{ marginRight: '8px' }}
          inputProps={{ style: textFieldStyle }}
        />
        <BaseButton variant="contained" onClick={handleVerify}>
          Verify Oku
        </BaseButton>
      </Row>
      {/* <HowItWorks /> */}
    </div>
  );
};

export default OkuCheck;
