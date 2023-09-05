import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: '5px'
};

const ConfirmBox = ({ title, text, confirmText, cancelText, onConfirm, onCancel, open }) => {
    return (
        <div>
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={open}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={open}>
                    <Box sx={style}>
                        <Typography id="transition-modal-title" variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                            {title}
                        </Typography>
                        <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                            {text}
                        </Typography>
                        <br />
                        <Button variant="contained"
                            sx={{ marginRight: '1em' }}
                            color="error" onClick={onConfirm}>{confirmText || "Yes"}</Button>
                        <Button variant="outlined" color="primary" onClick={onCancel}>{cancelText || "Cancel"}</Button>
                    </Box>
                </Fade>
            </Modal>
        </div>
    );
};

ConfirmBox.propTypes = {
    open: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    text: PropTypes.string,
    title: PropTypes.string
};
export default ConfirmBox;
