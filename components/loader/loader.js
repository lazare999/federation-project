import classes from '@/styles/loader/loader.module.css';

export default function Loader() {
  return (
    <div className={classes.loaderWrapper}>
      <div className={classes.loader}></div>
    </div>
  );
}
