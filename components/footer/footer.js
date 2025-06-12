import classes from '@/styles/footer/footer.module.css';
// import { FaFacebook, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <div className={classes.footerContainer}>
      <div>

      <h1 className={classes.title}>EQUESTRIAN SPORTS NATIONAL FEDERATION OF GEORGIA</h1>

      <div className={classes.address}>
        <p>LEO KVACHADZE STR. 37</p>
        <p>HIPPODROME LISI</p>
      </div>

      <div className={classes.contact}>
        <p>
          <span>TEL: </span>593301414
        </p>
        <p>
          <span>EMAIL: </span>RUSOPITSKHELAURI@GMAIL.COM
        </p>
      </div>

      <div className={classes.follow}>
        <h2>FOLLOW US:</h2>
        <div className={classes.icons}>
          {/* <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.icon}>
            <FaFacebook />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.icon}>
            <FaInstagram />
          </a> */}
        </div>
      </div>
      </div>
    </div>
  );
}
