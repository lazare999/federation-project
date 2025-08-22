import contactPageImage from '@/public/contact-page-image/contact-page-image.jpg';
import classes from '@/styles/contact/contact-container/contactContainer.module.css';
import Image from 'next/image';
import ContactForm from '../contact-form/contactForm';

export default function ContactContainer() {
  return (
    <div className={classes.content}>
      <div className={classes.imageContainer}>
        <Image
          src={contactPageImage}
          alt="Rider jumping horse"
          className={classes.image}
        />
      </div>
      <ContactForm />
    </div>
  );
}
