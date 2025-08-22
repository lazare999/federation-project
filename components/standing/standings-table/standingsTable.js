import classes from '@/styles/standings/standings-table/standingsTable.module.css';

const fakeData = Array.from({ length: 8 }, (_, i) => ({
  rkg: i + 1,
  rider: 'RUSUDAN PITSKHELAURI',
  points: 132,
  wins: 5,
}));

export default function StandingsTable() {
  return (
    <div className={classes.tableWrapper}>
      <div className={classes.headerRow}>
        <span>RKG</span>
        <span>RIDER</span>
        <span>TOTAL POINTS</span>
        <span>SEASON WINS</span>
      </div>
      {fakeData.map((rider) => (
        <div key={rider.rkg} className={classes.row}>
          <span>{rider.rkg}</span>
          <span>{rider.rider}</span>
          <span>{rider.points}</span>
          <span>{rider.wins}</span>
        </div>
      ))}
    </div>
  );
}
